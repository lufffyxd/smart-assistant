// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import ChatInterface from './components/ChatInterface';
import NotesSection from './components/NotesSection';
import PromptsSection from './components/PromptsSection';
import NotificationsSection from './components/NotificationsSection';
import api from './services/api';

const App = () => {
  // Add debugging log to see state changes
  const { user, logout, loading } = useAuth();
  console.log("App.jsx render - loading:", loading, "user:", user);

  const [activeTab, setActiveTab] = useState('chat');
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Load conversations when user logs in
  useEffect(() => {
    console.log("App useEffect triggered by 'user' change. User:", user);
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);
      if (res.data.length > 0) {
        setActiveConversation(res.data[0]);
      }
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
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    console.log("Rendering Login/Signup screen because user is null/undefined");
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">AI</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Smart Assistant</h1>
            <p className="text-gray-600 mt-2">Your AI-powered productivity companion</p>
          </div>

          <button
            onClick={() => {
              setAuthMode('login');
              setShowAuthModal(true);
            }}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition mb-4"
          >
            Login
          </button>
          
          <button
            onClick={() => {
              setAuthMode('signup');
              setShowAuthModal(true);
            }}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
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

  console.log("Rendering Main App Interface for user:", user);
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold">AI</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Smart Assistant</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-gray-600">Welcome, {user.email}</span>
          <button 
            onClick={logout}
            className="text-gray-600 hover:text-gray-800"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4">
            <button
              onClick={createNewConversation}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recent Chats</h3>
              <div className="mt-2 space-y-1">
                {conversations.map(conv => (
                  <div
                    key={conv._id}
                    onClick={() => setActiveConversation(conv)}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 ${
                      activeConversation?._id === conv._id ? 'bg-indigo-50 border border-indigo-200' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-800 truncate">{conv.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(conv.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('chat')}
                className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'chat' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat
              </button>
              
              <button
                onClick={() => setActiveTab('notes')}
                className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'notes' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Block Notes
              </button>
              
              <button
                onClick={() => setActiveTab('prompts')}
                className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'prompts' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Custom Prompts
              </button>
              
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'notifications' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notifications
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'chat' && (
            <ChatInterface 
              activeConversation={activeConversation}
              setActiveConversation={setActiveConversation}
              conversations={conversations}
              setConversations={setConversations}
            />
          )}
          
          {activeTab === 'notes' && <NotesSection />}
          
          {activeTab === 'prompts' && <PromptsSection />}
          
          {activeTab === 'notifications' && <NotificationsSection />}
        </div>
      </div>
    </div>
  );
};

export default App;