// client/src/components/UniversalChatInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const UniversalChatInterface = ({ 
  windowId, 
  windowTitle, 
  onBackToDashboard,
  enableWebSearch = false, // New prop
  isNewsWindow = false,
  isTaskManager = false,
  isNotesWindow = false,
  renderSpecialUI 
}) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [newsTopic, setNewsTopic] = useState(''); 
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false); // Local state for toggle
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync local state with prop
  useEffect(() => {
    setIsWebSearchEnabled(enableWebSearch);
  }, [enableWebSearch]);

  useEffect(() => {
    const initConversation = async () => {
      try {
        // Try to find an existing conversation for this window
        // This is a simplification, you might want a more robust way 
        // to associate a chat window with a conversation
        const res = await api.post('/chat/conversations', { 
          title: `${windowTitle} Chat` 
        });
        setConversationId(res.data._id);
        loadMessages(res.data._id);
      } catch (error) {
        console.error('UniversalChatInterface: Error initializing conversation:', error);
      }
    };

    initConversation();
  }, [windowTitle]);

  const loadMessages = async (convId) => {
    try {
      const res = await api.get(`/chat/conversations/${convId}/messages`);
      setMessages(res.data);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('UniversalChatInterface: Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isNewsWindow) {
      const loadQuery = async () => {
        try {
          const res = await api.get(`/news/queries?windowId=${windowId}`);
          if (res.data && res.data.topic) {
            setNewsTopic(res.data.topic);
            setIsMonitoring(true);
          }
        } catch (error) {
          console.error('UniversalChatInterface: Error loading news query:', error);
        }
      };
      loadQuery();
    }
  }, [isNewsWindow, windowId]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || !conversationId || isLoading) return;

    const userMessage = {
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      let aiMessageData;
      if (isNewsWindow) {
        const res = await api.post('/news/fetch', {
          topic: messageText,
          conversationId
        });
        aiMessageData = {
          text: res.data.message,
          sender: 'ai',
          timestamp: new Date()
        };
      } else {
        // For all other windows, including main chat, use standard chat endpoint
        // and pass the webSearch flag
        const res = await api.post(`/chat/conversations/${conversationId}/messages`, {
          text: messageText,
          // Pass the current state of the web search toggle
          searchEnabled: isWebSearchEnabled 
        });
        aiMessageData = res.data;
      }
      
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
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleNewsTopicChange = (e) => {
    setNewsTopic(e.target.value);
  };

  const saveNewsQuery = async () => {
    if (!newsTopic.trim()) return;
    
    try {
      await api.post('/news/queries', {
        windowId,
        topic: newsTopic
      });
      setIsMonitoring(true);
      const infoMessage = {
        text: `News monitoring activated for topic: "${newsTopic}". I will check for updates every 10 minutes.`,
        sender: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, infoMessage]);
    } catch (error) {
      console.error('UniversalChatInterface: Error saving news query:', error);
      const errorMessage = {
        text: 'Failed to activate news monitoring. Please try again.',
        sender: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const deactivateNewsQuery = async () => {
    try {
      await api.delete(`/news/queries?windowId=${windowId}`);
      setIsMonitoring(false);
      setNewsTopic('');
      const infoMessage = {
        text: 'News monitoring deactivated.',
        sender: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, infoMessage]);
    } catch (error) {
      console.error('UniversalChatInterface: Error deactivating news query:', error);
      const errorMessage = {
        text: 'Failed to deactivate news monitoring. Please try again.',
        sender: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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
            {windowTitle} Chat
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

      {renderSpecialUI && renderSpecialUI()}

      {isNewsWindow && (
        <div className="bg-bg-secondary border-b border-border p-3">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              type="text"
              placeholder="Enter a topic to monitor for news..."
              className="flex-1 p-2 rounded border border-border bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              value={newsTopic}
              onChange={handleNewsTopicChange}
              disabled={isMonitoring}
            />
            {isMonitoring ? (
              <button
                onClick={deactivateNewsQuery}
                className="bg-red-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-600 transition"
              >
                Deactivate Monitoring
              </button>
            ) : (
              <button
                onClick={saveNewsQuery}
                className="bg-accent text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-accent-hover transition"
              >
                Activate Notifications
              </button>
            )}
          </div>
          <p className="text-text-secondary text-xs mt-2">
            {isMonitoring 
              ? `Monitoring for news on "${newsTopic}"` 
              : 'Enter a topic and activate notifications to get updates.'}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4 text-white font-bold text-xl">
              AI
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Welcome to {windowTitle}</h3>
            <p className="text-text-secondary max-w-md">
              {isNewsWindow 
                ? 'Ask me to find news about a topic, or enter a topic above to activate notifications.' 
                : enableWebSearch 
                  ? 'Start a conversation. Enable "Web Search" to get live information.' 
                  : 'Start a conversation by typing a message below.'}
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 
                          message.sender === 'system' ? 'justify-center' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-accent text-white rounded-br-none'
                      : message.sender === 'system'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800'
                        : 'bg-bg-secondary border border-border text-text-primary rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.text}</div>
                  <div
                    className={`text-xs mt-1 flex justify-between ${
                      message.sender === 'user' ? 'text-accent-200' : 
                      message.sender === 'system' ? 'text-yellow-700 dark:text-yellow-400' : 
                      'text-text-secondary'
                    }`}
                  >
                    <span>
                      {message.sender === 'user' ? 'You' : 
                       message.sender === 'system' ? 'System' : 'AI'}
                    </span>
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

      <div className="border-t border-border bg-bg-secondary p-3 sticky bottom-0">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isNewsWindow ? "Ask about a news topic or enter one above..." : "Type your message..."}
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

export default UniversalChatInterface;