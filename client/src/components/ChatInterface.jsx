// client/src/components/ChatInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const ChatInterface = ({ activeConversation, setActiveConversation, setActiveTab }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation._id);
    } else {
      setMessages([]);
    }
  }, [activeConversation]);

  const loadMessages = async (conversationId) => {
    try {
      const res = await api.get(`/chat/conversations/${conversationId}/messages`);
      setMessages(res.data);
      // Scroll to bottom after messages load
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle sending a message
  const sendMessage = async (messageText) => {
    if (!messageText.trim() || !activeConversation || isLoading) return;

    const userMessage = {
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    // Reset textarea height
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }

    try {
      const res = await api.post(`/chat/conversations/${activeConversation._id}/messages`, {
        text: messageText,
        searchEnabled
      });

      const aiMessage = res.data;
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        text: 'Sorry, I encountered an error processing your request.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission (e.g., button click)
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  // Handle Enter key press in the textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
    // Auto-resize textarea
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Handle input change for auto-resize
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Handle lazy loading (placeholder)
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container && container.scrollTop === 0 && messages.length > 0) {
      // TODO: Implement logic to load older messages
      console.log("Reached top of scroll - load older messages");
    }
  };

  // Scroll to bottom when messages change (after sending/receiving)
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Chat Header */}
      <div className="bg-bg-secondary border-b border-border shadow-sm py-3 px-4 flex items-center">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="mr-3 p-2 rounded-md hover:bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Back to dashboard"
        >
          ←
        </button>
        <div className="flex-1 min-w-0"> {/* min-w-0 prevents flex item from overflowing */}
          <h2 className="text-lg font-semibold text-text-primary truncate">
            {activeConversation ? activeConversation.title : 'New Chat'}
          </h2>
          <div className="flex items-center text-xs text-text-secondary">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={searchEnabled}
                onChange={() => setSearchEnabled(!searchEnabled)}
                className="mr-1 h-4 w-4 text-accent border-border rounded focus:ring-accent"
              />
              Web Search
            </label>
          </div>
        </div>
        <button
          onClick={() => {
            // TODO: Implement save to notes logic
            alert('Save to Notes functionality would go here.');
          }}
          className="ml-2 bg-bg-secondary border border-border text-text-primary py-1 px-3 rounded-lg text-sm font-medium hover:bg-bg-primary transition disabled:opacity-50"
          disabled={messages.length === 0}
        >
          Save
        </button>
      </div>

      {/* Messages Container */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-6"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4 text-white font-bold text-xl">
              AI
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Start a conversation</h3>
            <p className="text-text-secondary max-w-md">
              Ask anything and get AI-powered assistance.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
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
            <div ref={messagesEndRef} />
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
              className="w-full border border-border rounded-2xl py-3 px-4 focus:ring-2 focus:ring-accent focus:border-transparent resize-none bg-bg-secondary text-text-primary max-h-32"
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

export default ChatInterface;