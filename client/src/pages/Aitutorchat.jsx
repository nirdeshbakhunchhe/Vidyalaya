// AITutorChat.jsx

// ── React ─────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react';

// ── Auth ──────────────────────────────────────────────────────────────────────
import { useAuth } from '../context/AuthContext';

// ── API ───────────────────────────────────────────────────────────────────────
import { chatAPI } from '../services/api';

// ── Layout shell ──────────────────────────────────────────────────────────────
import StudentShell from '../components/StudentShell';

// ── Icons (react-icons/fa only) ───────────────────────────────────────────────
import {
  FaPaperPlane,
  FaImage,
  FaFile,
  FaRobot,
  FaUser,
  FaTrash,
  FaCode,
  FaTimes,
  FaBook,
  FaFlask,
  FaCalculator,
  FaLanguage,
  FaPalette,
  FaMusic,
  FaChartLine,
  FaExclamationCircle,
} from 'react-icons/fa';

// ── Syntax highlighting (third-party — kept as-is, not a react-icons concern) ─
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// =============================================================================
// Constants
// =============================================================================

// Subject tabs — defined outside the component so they are not re-created on
// every render. Each entry carries its own active background class so the
// pill colour is self-contained.
const SUBJECTS = [
  { id: 'general',     name: 'General',     icon: FaBook,       activeClass: 'bg-blue-500'   },
  { id: 'mathematics', name: 'Mathematics', icon: FaCalculator, activeClass: 'bg-purple-500' },
  { id: 'science',     name: 'Science',     icon: FaFlask,      activeClass: 'bg-green-500'  },
  { id: 'programming', name: 'Programming', icon: FaCode,       activeClass: 'bg-cyan-500'   },
  { id: 'language',    name: 'Languages',   icon: FaLanguage,   activeClass: 'bg-orange-500' },
  { id: 'arts',        name: 'Arts',        icon: FaPalette,    activeClass: 'bg-pink-500'   },
  { id: 'music',       name: 'Music',       icon: FaMusic,      activeClass: 'bg-indigo-500' },
  { id: 'business',    name: 'Business',    icon: FaChartLine,  activeClass: 'bg-teal-500'   },
];

// =============================================================================
// Helpers
// =============================================================================

// Removes common markdown tokens that look noisy in chat bubbles.
// Important: we only apply this to plain-text segments (not inside ```code```).
const prettifyAiPlainText = (text) => {
  if (!text) return text;

  let out = String(text).replace(/\r\n/g, '\n');

  // Headings like "## Title" → "Title"
  out = out.replace(/^\s{0,3}#{1,6}\s+/gm, '');

  // Horizontal rules like "***" or "---" on their own line → removed
  out = out.replace(/^\s*([*\-_])\1\1+\s*$/gm, '');

  // Bold markers like "**text**" or "__text__" → "text"
  out = out.replace(/\*\*([^\n*]+)\*\*/g, '$1');
  out = out.replace(/__([^\n_]+)__/g, '$1');

  // Stray triple-asterisk emphasis tokens (not bullet points) → removed
  out = out.replace(/(^|[^\S\n])\*{3,}(?=([^\S\n]|$))/g, '$1');

  // Inline code markers `x` → x
  out = out.replace(/`([^`\n]+)`/g, '$1');

  // Collapse excessive blank lines
  out = out.replace(/\n{3,}/g, '\n\n');

  return out;
};

// Parses AI response text and renders fenced code blocks with syntax highlighting.
// Plain text segments are wrapped in <span> with whitespace-pre-wrap preserved.
const renderMessageContent = (content, { prettifyPlainText = false } = {}) => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Text before this code block
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {prettifyPlainText
            ? prettifyAiPlainText(content.substring(lastIndex, match.index))
            : content.substring(lastIndex, match.index)}
        </span>
      );
    }

    const language = match[1] || 'text';
    const code     = match[2].trim();

    parts.push(
      <div key={`code-${match.index}`} className="my-3 rounded-lg overflow-hidden">
        {/* Code block header: language label + copy button */}
        <div className="flex items-center justify-between bg-slate-800 px-4 py-2">
          <span className="text-xs text-slate-300 font-mono">{language}</span>
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="text-xs text-slate-400 hover:text-white transition-colors focus:outline-none"
          >
            Copy
          </button>
        </div>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{ margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after the last code block
  if (lastIndex < content.length) {
    parts.push(
      <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
        {prettifyPlainText
          ? prettifyAiPlainText(content.substring(lastIndex))
          : content.substring(lastIndex)}
      </span>
    );
  }

  return parts.length > 0 ? parts : <span className="whitespace-pre-wrap">{content}</span>;
};

const makeGreeting = (name) => ({
  id: 1,
  type: 'ai',
  content: `Hello ${name || 'there'}! 👋 I'm your AI tutor powered by Google Gemini. I'm here to help you learn and understand any topic. You can ask me questions, upload images or files, and I'll provide detailed explanations. What would you like to learn today?`,
  timestamp: new Date(),
});

const mapServerMessage = (msg, idx) => {
  const files = (msg.files || []).map((f) => ({
    // UI expects `type` + optional `url`.
    type: f.kind === 'image' ? 'image' : 'file',
    name: f.name,
    size: f.size ? `${(f.size / 1024).toFixed(2)} KB` : '',
    url: f.url, // may not exist for history messages
  }));

  return {
    id: idx + 1,
    type: msg.type,
    content: msg.content,
    timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
    files,
  };
};

// =============================================================================
// AITutorChat
// =============================================================================
const AITutorChat = () => {
  const { user } = useAuth();

  const [messages,         setMessages]         = useState([
    {
      id:        1,
      type:      'ai',
      content:   `Hello ${user?.name || 'there'}! 👋 I'm your AI tutor powered by Google Gemini. I'm here to help you learn and understand any topic. You can ask me questions, upload images or files, and I'll provide detailed explanations. What would you like to learn today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage,     setInputMessage]     = useState('');
  const [selectedSubject,  setSelectedSubject]  = useState('general');
  const [isTyping,         setIsTyping]         = useState(false);
  const [uploadedFiles,    setUploadedFiles]    = useState([]);
  const [error,            setError]            = useState(null);
  const [loadingHistory,  setLoadingHistory]  = useState(true);

  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);
  const imageInputRef  = useRef(null);

  // Auto-scroll to the latest message whenever messages or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load chat history whenever the selected subject changes.
  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      setLoadingHistory(true);
      setIsTyping(false);
      setError(null);

      // Clear any staged attachments/message when switching subjects.
      setInputMessage('');
      setUploadedFiles([]);

      try {
        const data = await chatAPI.getHistory({ subject: selectedSubject, limit: 50 });
        if (cancelled) return;

        const serverMessages = data?.messages || [];
        if (!serverMessages.length) {
          setMessages([makeGreeting(user?.name)]);
        } else {
          setMessages(serverMessages.map(mapServerMessage));
        }
      } catch {
        if (cancelled) return;
        setError('Failed to load chat history. Starting a fresh chat.');
        setMessages([makeGreeting(user?.name)]);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [selectedSubject, user?.name]);

  // ── API call (logic unchanged) ──────────────────────────────────────────────
  const callGeminiAPI = async (userMessage, files = []) => {
    const originalFiles = files.map((f) => f.originalFile).filter(Boolean);
    const data = await chatAPI.sendGemini({
      message: userMessage,
      subject: selectedSubject,
      files: originalFiles,
    });
    return data.response;
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return;

    const userMsg = {
      id:        messages.length + 1,
      type:      'user',
      content:   inputMessage,
      timestamp: new Date(),
      files:     uploadedFiles.length > 0 ? [...uploadedFiles] : null,
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentMessage = inputMessage;
    const currentFiles   = [...uploadedFiles];
    setInputMessage('');
    setUploadedFiles([]);
    setIsTyping(true);
    setError(null);

    try {
      const aiResponseText = await callGeminiAPI(currentMessage, currentFiles);
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, type: 'ai', content: aiResponseText, timestamp: new Date() },
      ]);
    } catch {
      setError('Failed to get response from AI. Please try again.');
      setMessages((prev) => [
        ...prev,
        {
          id:        prev.length + 1,
          type:      'ai',
          content:   'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date(),
          isError:   true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Submit on Enter; Shift+Enter inserts a newline.
  // onKeyDown is used instead of the deprecated onKeyPress.
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ── File handling ───────────────────────────────────────────────────────────
  const handleFileUpload = (e, type) => {
    const fileObjects = Array.from(e.target.files).map((file) => ({
      name:         file.name,
      size:         (file.size / 1024).toFixed(2) + ' KB',
      type,
      url:          URL.createObjectURL(file),
      originalFile: file,
    }));
    setUploadedFiles((prev) => [...prev, ...fileObjects]);
  };

  const removeFile = (index) =>
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));

  // ── Clear ────────────────────────────────────────────────────────────────
  const clearChat = async () => {
    if (!window.confirm('Are you sure you want to clear this chat history?')) return;

    setLoadingHistory(true);
    setError(null);

    try {
      await chatAPI.clearHistory({ subject: selectedSubject });
      setMessages([makeGreeting(user?.name)]);
    } catch {
      setError('Failed to clear chat history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <StudentShell>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">

        {/* Card wrapper — header + subject bar + chat area share one rounded card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
             style={{ height: 'calc(100vh - 140px)', minHeight: '520px' }}>

          {/* ── Card header ──────────────────────────────────────────────── */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              {/* AI avatar icon */}
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow">
                <FaRobot className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">AI Tutor Assistant</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Google Gemini AI</p>
              </div>
            </div>

            {/* Clear action */}
            <div className="flex space-x-2">
              <button
                onClick={clearChat}
                aria-label="Clear chat"
                title="Clear Chat"
                className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <FaTrash />
              </button>
            </div>
          </div>

          {/* ── Subject selector ─────────────────────────────────────────── */}
          <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0 overflow-x-auto">
            <div className="flex gap-2 w-max">
              {SUBJECTS.map((s) => {
                const { id, name, activeClass, icon } = s;
                const Icon = icon;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedSubject(id)}
                    aria-pressed={selectedSubject === id}
                    className={[
                      'flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400',
                      selectedSubject === id
                        ? `${activeClass} text-white shadow scale-105`
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700',
                    ].join(' ')}
                  >
                    <Icon className="text-xs" />
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Messages area ────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">

            {/* Global error banner */}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 text-sm px-4 py-3 rounded-xl"
              >
                <FaExclamationCircle className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loadingHistory ? (
              <div className="flex items-center justify-center py-10 text-slate-500 dark:text-slate-400">
                <div className="w-7 h-7 border-2 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                <div
                  className={`flex items-start space-x-3 max-w-[80%] ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'ai'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                        : 'bg-gradient-to-br from-slate-500 to-slate-700'
                    }`}
                  >
                    {message.type === 'ai'
                      ? <FaRobot className="text-white text-xs" />
                      : <FaUser  className="text-white text-xs" />
                    }
                  </div>

                  {/* Bubble */}
                  <div>
                    <div
                      className={[
                        'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                        message.type === 'ai'
                          ? message.isError
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/30'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                          : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white',
                      ].join(' ')}
                    >
                      {renderMessageContent(message.content, { prettifyPlainText: message.type === 'ai' })}

                      {/* Attached files shown inside the user bubble */}
                      {message.files && message.files.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.files.map((file, idx) => (
                            <div key={idx} className="flex items-center space-x-2 bg-white dark:bg-slate-900/10 rounded-lg p-2">
                              {file.type === 'image' ? (
                                <>
                                  <FaImage className="text-xs flex-shrink-0" />
                                  {file.url ? (
                                    <img
                                      src={file.url}
                                      alt={file.name}
                                      className="h-20 rounded object-cover"
                                    />
                                  ) : (
                                    <div>
                                      <p className="text-xs font-medium">{file.name}</p>
                                      <p className="text-xs opacity-70">{file.size}</p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <FaFile className="text-xs flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-medium">{file.name}</p>
                                    <p className="text-xs opacity-70">{file.size}</p>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-slate-400 mt-1 px-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                </div>
              ))
            )}

            {/* Typing indicator — three bouncing dots with staggered delay */}
            {isTyping && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                  <FaRobot className="text-white text-xs" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl px-4 py-3">
                  <div className="flex space-x-1.5">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Invisible anchor scrolled into view on new messages */}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Staged file previews ─────────────────────────────────────── */}
          {uploadedFiles.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
              <div className="flex items-center space-x-2 overflow-x-auto">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative flex-shrink-0 bg-white dark:bg-slate-700 rounded-lg p-2 border border-slate-200 dark:border-slate-600"
                  >
                    {file.type === 'image' ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-16 w-16 object-cover rounded"
                      />
                    ) : (
                      <div className="h-16 w-16 flex flex-col items-center justify-center">
                        <FaFile className="text-2xl text-slate-400" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate w-full text-center">
                          {file.name.slice(0, 8)}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      aria-label={`Remove ${file.name}`}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <FaTimes className="text-[8px]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Input bar ────────────────────────────────────────────────── */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-end gap-2">

              {/* Hidden file inputs — triggered by icon buttons below */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload(e, 'image')}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e, 'file')}
                className="hidden"
              />

              {/* Attachment buttons */}
              <button
                onClick={() => imageInputRef.current?.click()}
                aria-label="Upload image"
                title="Upload Image"
                className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 flex-shrink-0"
              >
                <FaImage />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload file"
                title="Upload File"
                className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 flex-shrink-0"
              >
                <FaFile />
              </button>

              {/* Message textarea — auto-height via CSS min/max */}
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything…"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
                className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 bg-white dark:bg-slate-700 outline-none resize-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 dark:hover:border-slate-500"
              />

              {/* Send button */}
              <button
                onClick={handleSendMessage}
                disabled={
                  loadingHistory || isTyping || (!inputMessage.trim() && uploadedFiles.length === 0)
                }
                aria-label="Send message"
                className="p-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 flex-shrink-0"
              >
                <FaPaperPlane />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-400 font-mono text-[10px]">Enter</kbd> to send,{' '}
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-400 font-mono text-[10px]">Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>
      </div>
    </StudentShell>
  );
};

export default AITutorChat;