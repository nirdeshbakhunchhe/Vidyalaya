// routes/chatRoutes.js - Backend route for Gemini AI Chat (ES6 Module)

import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { protect } from '../middleware/auth.js';
import ChatHistory from '../models/chatHistory.model.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Convert file buffer to Gemini format
const fileToGenerativePart = (buffer, mimeType) => {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType: mimeType,
    },
  };
};

// System prompts based on subject
const getSystemPrompt = (subject) => {
  const prompts = {
    general: "You are a helpful and knowledgeable AI tutor. Provide clear, concise, and educational explanations. Use examples when helpful. Format code with proper markdown code blocks using ``` syntax.",
    mathematics: "You are an expert mathematics tutor. Explain concepts step-by-step, show your work clearly, and provide practice problems when appropriate. Use clear mathematical notation and LaTeX when needed.",
    science: "You are a science tutor specializing in physics, chemistry, and biology. Explain scientific concepts clearly, use real-world examples, and encourage scientific curiosity. Break down complex topics into understandable parts.",
    programming: "You are a programming tutor. Explain code concepts clearly, provide working examples with proper syntax highlighting using markdown code blocks (```language), follow best practices, and help debug issues.",
    language: "You are a language tutor. Help with grammar, vocabulary, pronunciation, and cultural context. Provide clear examples and encourage practice through conversation.",
    arts: "You are an arts tutor covering visual arts, design, and creative expression. Discuss techniques, art history, and provide constructive feedback on creative work.",
    music: "You are a music tutor. Help with music theory, technique, history, and appreciation. Use musical terminology appropriately and provide practical exercises.",
    business: "You are a business tutor. Cover concepts in management, economics, finance, marketing, and entrepreneurship with practical real-world examples and case studies.",
  };
  
  return prompts[subject] || prompts.general;
};

// POST /api/chat/gemini - Send message to Gemini AI
router.post('/gemini', protect, upload.array('files', 5), async (req, res) => {
  try {
    const { message, subject = 'general' } = req.body;
    const files = req.files || [];
    const userId = req.user._id;
    const normalizedSubject = String(subject || 'general').trim().toLowerCase();

    if (!message && files.length === 0) {
      return res.status(400).json({ error: 'Message or files required' });
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured',
        message: 'Please add GEMINI_API_KEY to your .env file' 
      });
    }

    // Choose the model based on whether files are included.
    // The older "gemini-1.5-flash" model is no longer available for the current API version,
    // which was causing 404 errors. Use a current flash model instead.
    const modelName = files.length > 0 ? "gemini-2.5-flash" : "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    // Build the prompt with system instructions
    const systemPrompt = getSystemPrompt(normalizedSubject);
    const fullPrompt = `${systemPrompt}\n\nStudent Question: ${message}`;

    let result;

    if (files.length > 0) {
      // Handle multimodal request (text + images/files)
      const imageParts = files.map(file => 
        fileToGenerativePart(file.buffer, file.mimetype)
      );
      
      result = await model.generateContent([fullPrompt, ...imageParts]);
    } else {
      // Text-only request
      result = await model.generateContent(fullPrompt);
    }

    // In @google/generative-ai v0.24.x, generateContent returns
    // a result object with a synchronous `response` property.
    const response = result.response;
    const text = response.text();

    // Save chat history to database (prototype persistence).
    const fileMetas = files.map((file) => ({
      kind: file.mimetype && file.mimetype.startsWith('image/') ? 'image' : 'file',
      name: file.originalname || '',
      mimetype: file.mimetype || '',
      size: file.size || 0,
    }));

    const userMessage = {
      type: 'user',
      content: String(message || ''),
      files: fileMetas,
      createdAt: new Date(),
    };

    const aiMessage = {
      type: 'ai',
      content: text,
      files: [],
      createdAt: new Date(),
    };

    const history = await ChatHistory.findOne({
      user: userId,
      subject: normalizedSubject,
    });

    if (!history) {
      await ChatHistory.create({
        user: userId,
        subject: normalizedSubject,
        messages: [userMessage, aiMessage],
      });
    } else {
      // Keep last 50 messages to avoid unbounded growth.
      await ChatHistory.updateOne(
        { _id: history._id },
        { $push: { messages: { $each: [userMessage, aiMessage], $slice: -50 } } }
      );
    }

    res.json({
      success: true,
      response: text,
      subject: normalizedSubject,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API key')) {
      return res.status(401).json({ 
        error: 'Invalid Gemini API key',
        message: 'Please check your GEMINI_API_KEY in .env file' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to process AI request',
      message: error.message 
    });
  }
});

// GET /api/chat/history?subject=general&limit=50
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const subject = String(req.query.subject || 'general').trim().toLowerCase();
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || '50', 10), 200));

    const history = await ChatHistory.findOne({ user: userId, subject }).lean();
    const messages = history?.messages?.slice(-limit) || [];

    res.json({ success: true, subject, messages });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch chat history' });
  }
});

// Convenience: GET /api/chat/history/:subject
router.get('/history/:subject', protect, async (req, res) => {
  const subject = String(req.params.subject || 'general').trim().toLowerCase();
  return res.redirect(`/api/chat/history?subject=${encodeURIComponent(subject)}`);
});

// DELETE /api/chat/history?subject=general
router.delete('/history', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const subject = String(req.query.subject || 'general').trim().toLowerCase();

    await ChatHistory.deleteOne({ user: userId, subject });

    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ success: false, error: 'Failed to clear chat history' });
  }
});

// Convenience: DELETE /api/chat/history/:subject
router.delete('/history/:subject', protect, async (req, res) => {
  const subject = String(req.params.subject || 'general').trim().toLowerCase();
  return res.redirect(`/api/chat/history?subject=${encodeURIComponent(subject)}`);
});

// POST /api/chat/test - Test endpoint to verify Gemini API is working
router.post('/test', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        success: false,
        error: 'Gemini API key not configured' 
      });
    }

    // Use current flash model for test endpoint as well
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say 'Hello, I am your AI tutor!' in one sentence.");
    const response = result.response;
    const text = response.text();

    res.json({
      success: true,
      message: 'Gemini API is working!',
      response: text,
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;