// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext'; // Import useTheme
import AuthModal from './components/AuthModal';
import ChatInterface from './components/ChatInterface';
import api from './services/api';

const App = () => {
  const { user, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme(); // Use theme context
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Load conversations when user logs in
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const res = await api.post('/chat/conversations', { title: 'New Chat' });
      const newConversation = res.data;
      setConversations([newConversation, ...conversations]);
      setActiveConversation(newConversation);
      setActiveTab('chat');
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-bg-secondary rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">AI</span>
            </div>
            <h1 className="text-3xl font-bold text-text-primary">Smart Assistant</h1>
            <p className="text-text-secondary mt-2">Your AI-powered productivity companion</p>
          </div>

          <button
            onClick={() => {
              setAuthMode('login');
              setShowAuthModal(true);
            }}
            className="w-full bg-accent text-white py-3 rounded-lg font-medium hover:bg-accent-hover transition mb-4"
          >
            Login
          </button>

          <button
            onClick={() => {
              setAuthMode('signup');
              setShowAuthModal(true);
            }}
            className="w-full border border-border text-text-primary py-3 rounded-lg font-medium hover:bg-bg-primary transition"
          >
            Sign Up
          </button>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
        />
      </div>
    );
  }

  // Dashboard Window Cards Data
  const windowCards = [
    {
      id: 'chat',
      title: 'Chat Hub',
      description: 'Interact with your AI assistant',
      accentColor: 'bg-indigo-500', // Tailwind class
      xp: 15,
      isNew: false,
    },
    {
      id: 'notes',
      title: 'Block Note',
      description: 'Capture and organize your thoughts',
      accentColor: 'bg-emerald-500', // Tailwind class
      xp: 8,
      isNew: true,
    },
    {
      id: 'tasks',
      title: 'Task Manager',
      description: 'Manage your to-do list and deadlines',
      accentColor: 'bg-amber-500', // Tailwind class
      xp: 12,
      isNew: false,
    },
    {
      id: 'calendar',
      title: 'Calendar View',
      description: 'Schedule and track events',
      accentColor: 'bg-violet-500', // Tailwind class
      xp: 5,
      isNew: true,
    },
    {
      id: 'news',
      title: 'News & Search',
      description: 'Stay updated with the latest news',
      accentColor: 'bg-red-500', // Tailwind class
      xp: 10,
      isNew: false,
    },
    {
      id: 'prompts',
      title: 'Custom Prompts',
      description: 'Create and manage AI prompts',
      accentColor: 'bg-sky-500', // Tailwind class
      xp: 7,
      isNew: false,
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="bg-bg-secondary border-b border-border shadow-sm py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold">AI</span>
          </div>
          <h1 className="text-xl font-bold text-text-primary">Smart Assistant</h1>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-text-secondary text-sm hidden md:inline">Welcome, {user.email}</span>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <span className="text-xl">🌙</span> // Moon icon for light mode
            ) : (
              <span className="text-xl">☀️</span> // Sun icon for dark mode
            )}
          </button>
          <button
            onClick={logout}
            className="text-text-secondary hover:text-text-primary text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' && (
          <div className="p-6 h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Your Windows</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {windowCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-bg-secondary rounded-2xl shadow-md border border-border overflow-hidden transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer flex flex-col h-full"
                  onClick={() => {
                    if (card.id === 'chat') {
                      createNewConversation();
                    } else {
                      setActiveTab(card.id);
                    }
                  }}
                >
                  {/* Accent Border Top */}
                  <div className={`h-2 ${card.accentColor}`}></div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-text-primary">{card.title}</h3>
                      <div className="flex space-x-2">
                        {card.isNew && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                            New
                          </span>
                        )}
                        {card.xp > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                            {card.xp} XP
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-text-secondary text-sm mb-4 flex-1">{card.description}</p>
                    <button
                      className={`mt-auto w-full py-2 px-4 rounded-lg text-sm font-medium text-white ${card.accentColor} hover:opacity-90 transition`}
                    >
                      {card.id === 'chat' ? 'New Chat' : 'Open Window'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && activeConversation && (
          <ChatInterface
            activeConversation={activeConversation}
            setActiveConversation={setActiveConversation}
            setActiveTab={setActiveTab}
          />
        )}

        {/* TODO: Implement other sections (notes, tasks, etc.) */}
        {activeTab !== 'dashboard' && activeTab !== 'chat' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-bg-primary">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {windowCards.find(c => c.id === activeTab)?.title || 'Feature'}
            </h2>
            <p className="text-text-secondary mb-6">This section is under development.</p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="bg-bg-secondary border border-border text-text-primary py-2 px-4 rounded-lg font-medium hover:bg-bg-primary transition"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;