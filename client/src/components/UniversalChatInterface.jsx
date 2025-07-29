// client/src/components/UniversalChatInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const UniversalChatInterface = ({
  windowId,
  windowTitle,
  onBackToDashboard,
  enableWebSearch = false, // Prop to enable/disable web search toggle
}) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false); // Local state for toggle
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync local state with prop
  useEffect(() => {
    setIsWebSearchEnabled(enableWebSearch);
  }, [enableWebSearch]);

  // Initialize conversation
  useEffect(() => {
    const initConversation = async () => {
      try {
        // Try to find or create a conversation linked to this specific window
        // We can use the windowId to find or create a unique conversation for it
        const res = await api.post('/chat/conversations', {
          title: `${windowTitle}`, // Use window title as conversation title
          windowId: windowId // Pass windowId to link conversation
        });
        setConversationId(res.data._id);
        loadMessages(res.data._id);
      } catch (error) {
        console.error('UniversalChatInterface: Error initializing conversation:', error);
        // Handle error, maybe show a message to the user
      }
    };

    initConversation();
  }, [windowTitle, windowId]);

  const loadMessages = async (convId) => {
    if (!convId) return;
    try {
      // Load the last 15 messages initially
      const res = await api.get(`/chat/conversations/${convId}/messages?limit=15&page=1`);
      // Assuming API returns { messages: [...], currentPage, totalPages, hasNextPage, hasPrevPage }
      // Messages are sorted oldest first by backend, so we reverse for display (newest at bottom)
      setMessages(res.data.messages.reverse());
      // For simplicity, we're not handling pagination here yet.
      // scrollToBottom is handled by the effect below.
    } catch (error) {
      console.error('UniversalChatInterface: Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || !conversationId || isLoading) return;

    const userMessage = {
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    // Optimistically add user message to UI
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Send message to backend, including the webSearch flag
      const res = await api.post(`/chat/conversations/${conversationId}/messages`, {
        text: messageText,
        searchEnabled: isWebSearchEnabled // Pass the current toggle state
      });

      const aiMessageData = res.data;
      // Add AI response to UI
      setMessages(prev => [...prev, aiMessageData]);
    } catch (error) {
      console.error('UniversalChatInterface: Error sending message:', error);
      const errorMessage = {
        text: error.response?.data?.message || 'Sorry, I encountered an error processing your request.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // Adjust height based on scrollHeight, with a max
      const newHeight = Math.min(textareaRef.current.scrollHeight, 150); // Max 150px
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 150);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  // Handler for toggling web search
  const toggleWebSearch = () => {
    setIsWebSearchEnabled(prev => !prev);
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="bg-bg-secondary border-b border-border shadow-sm py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center">
          <button
            onClick={onBackToDashboard}
            className="mr-3 p-2 rounded-md hover:bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            aria-label="Back to dashboard"
          >
            ← Dashboard
          </button>
          <h2 className="text-lg font-semibold text-text-primary truncate">
            {windowTitle}
          </h2>
        </div>

        {/* Web Search Toggle (if enabled for this window) */}
        {enableWebSearch && (
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={isWebSearchEnabled}
                onChange={toggleWebSearch}
                className="mr-1 h-4 w-4 text-accent border-border rounded focus:ring-accent"
              />
              <span className={isWebSearchEnabled ? 'text-accent font-medium' : 'text-text-secondary'}>
                Web Search
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4 text-white font-bold text-xl">
              AI
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Welcome to {windowTitle}</h3>
            <p className="text-text-secondary max-w-md">
              {enableWebSearch
                ? 'Start a conversation. Enable "Web Search" to get live information.'
                : 'Start a conversation by typing a message below.'}
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={`${message.timestamp}-${index}`} // More robust key
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-accent text-white rounded-br-none'
                      : 'bg-bg-secondary border border-border text-text-primary rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.text}</div>
                  <div
                    className={`text-xs mt-1 flex justify-between ${
                      message.sender === 'user' ? 'text-accent-200' : 'text-text-secondary'
                    }`}
                  >
                    <span>{message.sender === 'user' ? 'You' : 'AI'}</span>
                    <span>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-bg-secondary border border-border rounded-3xl rounded-bl-none px-4 py-3 shadow-sm">
                  <div className="loading-dots flex">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} /> {/* Element to scroll to */}
          </>
        )}
      </div>

      {/* Input Area - Sticky */}
      <div className="border-t border-border bg-bg-secondary p-3 sticky bottom-0">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full border border-border rounded-2xl py-3 px-4 focus:ring-2 focus:ring-accent focus:border-transparent resize-none bg-bg-secondary text-text-primary max-h-40" // Increased max height
              rows="1"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-accent text-white rounded-2xl w-12 h-12 flex items-center justify-center hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
            aria-label="Send message"
          >
            ↵
          </button>
        </form>
      </div>
    </div>
  );
};

export default UniversalChatInterface;
