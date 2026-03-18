import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StudentShell from '../components/StudentShell';
import { 
  FaPaperPlane,
  FaImage,
  FaFile,
  FaRobot,
  FaUser,
  FaTrash,
  FaSave,
  FaCode,
  FaTimes,
  FaBook,
  FaFlask,
  FaCalculator,
  FaLanguage,
  FaPalette,
  FaMusic,
  FaChartLine
} from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const AITutorChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `Hello ${user?.name || 'there'}! 👋 I'm your AI tutor powered by Google Gemini. I'm here to help you learn and understand any topic. You can ask me questions, upload images or files, and I'll provide detailed explanations. What would you like to learn today?`,
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('general');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const subjects = [
    { id: 'general', name: 'General', icon: FaBook, activeClass: 'bg-blue-500' },
    { id: 'mathematics', name: 'Mathematics', icon: FaCalculator, activeClass: 'bg-purple-500' },
    { id: 'science', name: 'Science', icon: FaFlask, activeClass: 'bg-green-500' },
    { id: 'programming', name: 'Programming', icon: FaCode, activeClass: 'bg-cyan-500' },
    { id: 'language', name: 'Languages', icon: FaLanguage, activeClass: 'bg-orange-500' },
    { id: 'arts', name: 'Arts', icon: FaPalette, activeClass: 'bg-pink-500' },
    { id: 'music', name: 'Music', icon: FaMusic, activeClass: 'bg-indigo-500' },
    { id: 'business', name: 'Business', icon: FaChartLine, activeClass: 'bg-teal-500' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Convert file to base64 for Gemini API
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Call Gemini API
  const callGeminiAPI = async (userMessage, files = []) => {
    try {
      const formData = new FormData();
      formData.append('message', userMessage);
      formData.append('subject', selectedSubject);
      
      // Add files if any
      if (files.length > 0) {
        files.forEach((file, index) => {
          formData.append('files', file.originalFile);
        });
      }

      const response = await fetch('http://localhost:5000/api/chat/gemini', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return;

    const newMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : null,
    };

    setMessages([...messages, newMessage]);
    const currentMessage = inputMessage;
    const currentFiles = [...uploadedFiles];
    setInputMessage('');
    setUploadedFiles([]);
    setIsTyping(true);
    setError(null);

    try {
      // Call Gemini API
      const aiResponseText = await callGeminiAPI(currentMessage, currentFiles);

      const aiResponse = {
        id: messages.length + 2,
        type: 'ai',
        content: aiResponseText,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setError('Failed to get response from AI. Please try again.');
      
      // Add error message
      const errorMessage = {
        id: messages.length + 2,
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    const fileObjects = files.map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      type: type,
      url: URL.createObjectURL(file),
      originalFile: file, // Store original file for upload
    }));
    setUploadedFiles([...uploadedFiles, ...fileObjects]);
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([
        {
          id: 1,
          type: 'ai',
          content: `Chat cleared! How can I help you today, ${user?.name}?`,
          timestamp: new Date(),
        }
      ]);
    }
  };

  const saveChatHistory = () => {
    const chatData = {
      user: user?.name,
      subject: selectedSubject,
      messages: messages.map(msg => ({
        ...msg,
        files: msg.files ? msg.files.map(f => ({ name: f.name, type: f.type })) : null
      })),
      savedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-tutor-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Enhanced code block detection and rendering
  const renderMessageContent = (content) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add code block
      const language = match[1] || 'text';
      const code = match[2].trim();
      parts.push(
        <div key={`code-${match.index}`} className="my-3">
          <div className="flex items-center justify-between bg-slate-800 px-4 py-2 rounded-t-lg">
            <span className="text-xs text-slate-300 font-mono">{language}</span>
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              className="text-xs text-slate-300 hover:text-white"
            >
              Copy
            </button>
          </div>
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {content.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : <span className="whitespace-pre-wrap">{content}</span>;
  };

  return (
    <StudentShell>
      <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FaRobot className="text-white text-xl" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                      AI Tutor Assistant
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Powered by Google Gemini AI
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={saveChatHistory}
                    className="p-3 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                    title="Save Chat History"
                  >
                    <FaSave />
                  </button>
                  <button
                    onClick={clearChat}
                    className="p-3 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                    title="Clear Chat"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>

            {/* Subject Selector */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => {
                  const Icon = subject.icon;
                  return (
                    <button
                      key={subject.id}
                      onClick={() => setSelectedSubject(subject.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                        selectedSubject === subject.id
                          ? `${subject.activeClass} text-white shadow-lg scale-105`
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="text-sm" />
                      <span className="text-sm font-medium">{subject.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="bg-white dark:bg-slate-800 rounded-b-2xl shadow-xl border-x border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col h-[600px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'ai' 
                          ? 'bg-gradient-to-br from-primary-500 to-primary-600' 
                          : 'bg-gradient-to-br from-slate-600 to-slate-700'
                      }`}>
                        {message.type === 'ai' ? (
                          <FaRobot className="text-white text-sm" />
                        ) : (
                          <FaUser className="text-white text-sm" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div>
                        <div className={`rounded-2xl px-4 py-3 ${
                          message.type === 'ai'
                            ? message.isError 
                              ? 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-200'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                            : 'bg-gradient-to-r from-primary-600 to-primary-500 text-white'
                        }`}>
                          {renderMessageContent(message.content)}
                          
                          {/* Display uploaded files */}
                          {message.files && message.files.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.files.map((file, idx) => (
                                <div key={idx} className="flex items-center space-x-2 bg-white/10 rounded-lg p-2">
                                  {file.type === 'image' ? (
                                    <>
                                      <FaImage className="text-sm" />
                                      <img src={file.url} alt={file.name} className="h-20 rounded" />
                                    </>
                                  ) : (
                                    <>
                                      <FaFile className="text-sm" />
                                      <div className="flex-1">
                                        <p className="text-xs font-medium">{file.name}</p>
                                        <p className="text-xs opacity-75">{file.size}</p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 px-2">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                      <FaRobot className="text-white text-sm" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl px-4 py-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* File Preview Area */}
              {uploadedFiles.length > 0 && (
                <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-center space-x-2 overflow-x-auto">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="relative flex-shrink-0 bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                        {file.type === 'image' ? (
                          <img src={file.url} alt={file.name} className="h-16 w-16 object-cover rounded" />
                        ) : (
                          <div className="h-16 w-16 flex flex-col items-center justify-center">
                            <FaFile className="text-2xl text-slate-400" />
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate w-full text-center">{file.name.slice(0, 8)}</p>
                          </div>
                        )}
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-end space-x-2">
                  {/* File Upload Buttons */}
                  <div className="flex space-x-2">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'image')}
                      className="hidden"
                    />
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      title="Upload Image"
                    >
                      <FaImage />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'file')}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      title="Upload File"
                    >
                      <FaFile />
                    </button>
                  </div>

                  {/* Message Input */}
                  <div className="flex-1">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything..."
                      rows="1"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                      style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() && uploadedFiles.length === 0}
                    className="p-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    <FaPaperPlane />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentShell>
  );
};

export default AITutorChat;
