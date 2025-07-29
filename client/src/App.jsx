// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useDashboard } from './context/DashboardContext';
import { useNews } from './context/NewsContext';
import AuthModal from './components/AuthModal';
import UniversalChatInterface from './components/UniversalChatInterface';
import NotesSection from './components/NotesSection';
import TaskManager from './components/TaskManager';
import api from './services/api';

const App = () => {
  const { user, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { layout, toggleLayout, customWindows, pinnedWindows, pinWindow, unpinWindow, addCustomWindow } = useDashboard();
  const { loadNewsQuery } = useNews();

  // State for managing different views/tabs within the app
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to dashboard view
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [searchQuery, setSearchQuery] = useState(''); // For potential global search
  // State for managing feature window chats (Notes, Tasks, News, etc.)
  const [activeFeatureWindow, setActiveFeatureWindow] = useState(null);

  // Load user's conversations when they log in
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]); // Dependency array ensures this runs when 'user' changes

  const loadConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);
    } catch (error) {
      console.error('App: Error loading conversations:', error);
      // Optionally, show an error message to the user
    }
  };

  // Function to create a new conversation/chat
  const createNewConversation = async (title = 'New Chat') => {
    try {
      const res = await api.post('/chat/conversations', { title });
      const newConversation = res.data;
      // Update the local state with the new conversation
      setConversations([newConversation, ...conversations]);
      setActiveConversation(newConversation);
      // Optionally, switch to the chat view
      // setActiveTab('chat'); 
    } catch (error) {
      console.error('App: Error creating conversation:', error);
      // Optionally, show an error message to the user
    }
  };

  // Function to open a specific feature window in chat mode
  const openFeatureWindowChat = (windowId, windowTitle) => {
    setActiveFeatureWindow({ id: windowId, title: windowTitle });
    setActiveTab('feature-chat'); // Switch to the feature chat view
  };

  // Function to navigate back to the main dashboard
  const handleBackToDashboard = () => {
    setActiveFeatureWindow(null);
    setActiveTab('dashboard'); // Switch back to dashboard view
  };

  // --- NEW: Effect for handling initial routing based on auth state ---
  // This effect runs after the initial authentication check is complete
  useEffect(() => {
    // Don't do anything while the auth state is still being determined
    if (loading) {
      console.log("App: Auth state is loading...");
      return;
    }

    console.log(`App: Auth check complete. User: ${user ? 'Present' : 'Absent'}, Path: ${window.location.pathname}`);

    // If the user is authenticated and they are on the root path (e.g., after a refresh),
    // redirect them to the dashboard view.
    if (user && window.location.pathname === '/') {
      console.log("App: Authenticated user on root path, redirecting to dashboard view.");
      setActiveTab('dashboard');
    }

    // If the user is not authenticated, the conditional rendering below
    // will show the login/signup screen.
    // No explicit action needed here for that case.

  }, [user, loading]); // Re-run this effect if 'user' or 'loading' changes
  // --- END OF NEW EFFECT ---

  // Show a loading screen while checking authentication status
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

  // If the user is not authenticated, show the login/signup screen
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

  // --- If the user IS authenticated, render the main application UI ---

  // Define the base set of available windows
  const baseWindowCards = [
    {
      id: 'chat',
      title: 'Chat Hub',
      description: 'Interact with your AI assistant',
      accentColor: 'bg-indigo-500',
      xp: 15,
      isNew: false,
    },
    {
      id: 'notes',
      title: 'Block Note',
      description: 'Capture and organize your thoughts',
      accentColor: 'bg-emerald-500',
      xp: 8,
      isNew: true,
    },
    {
      id: 'tasks',
      title: 'Task Manager',
      description: 'Manage your to-do list and deadlines',
      accentColor: 'bg-amber-500',
      xp: 12,
      isNew: false,
    },
    {
      id: 'news',
      title: 'News & Search',
      description: 'Stay updated with the latest news',
      accentColor: 'bg-red-500',
      xp: 10,
      isNew: false,
    },
    {
      id: 'prompts',
      title: 'Custom Prompts',
      description: 'Create and manage AI prompts',
      accentColor: 'bg-sky-500',
      xp: 7,
      isNew: false,
    },
    {
      id: 'crypto',
      title: 'Crypto Tracker',
      description: 'Monitor cryptocurrency prices',
      accentColor: 'bg-purple-500',
      xp: 5,
      isNew: true,
    },
    {
      id: 'fitness',
      title: 'Fitness Pro',
      description: 'Track workouts and nutrition',
      accentColor: 'bg-green-500',
      xp: 6,
      isNew: false,
    },
  ];

  // Combine base windows with any user-created custom windows
  const allWindowCards = [...baseWindowCards, ...customWindows];

  // Separate pinned and unpinned windows for display
  const pinnedCards = allWindowCards.filter(card => pinnedWindows.includes(card.id));
  const unpinnedCards = allWindowCards.filter(card => !pinnedWindows.includes(card.id));

  return (
    <div className="flex flex-col h-screen bg-bg-primary text-text-primary">
      {/* Application Header */}
      <header className="bg-bg-secondary border-b border-border shadow-sm py-4 px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center w-full sm:w-auto">
          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold">AI</span>
          </div>
          <h1 className="text-xl font-bold text-text-primary">Smart Assistant</h1>
        </div>

        {/* Global Search Bar (Placeholder for future implementation) */}
        <div className="flex-1 max-w-2xl w-full">
          <div className="relative">
            <input
              type="text"
              placeholder="Search across all windows..."
              className="w-full py-2 px-4 pl-10 rounded-lg border border-border bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              // Disabled for now as global search logic isn't fully implemented here
              disabled
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* User Controls */}
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="p-6 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-text-primary">Your Windows</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleLayout}
                  className="bg-bg-secondary border border-border text-text-primary py-2 px-4 rounded-lg text-sm font-medium hover:bg-bg-primary transition flex items-center"
                >
                  {layout === 'grid' ? 'List View' : 'Grid View'}
                </button>
                <button
                  onClick={() => {
                    const title = prompt('Enter custom window title:');
                    if (title) {
                      const newWindow = {
                        title,
                        description: `Custom window: ${title}`,
                        accentColor: 'bg-gray-500' // Default color
                      };
                      const createdWindow = addCustomWindow(newWindow);
                      // Optionally open the new window immediately
                      // openFeatureWindowChat(createdWindow.id, createdWindow.title);
                    }
                  }}
                  className="bg-accent text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-accent-hover transition flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Window
                </button>
              </div>
            </div>

            {/* Pinned Windows Section */}
            {pinnedCards.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.5 17.5a.5.5 0 01-1 0V2.914l-.646-.647a.5.5 0 01.708-.708l1.5 1.5a.5.5 0 010 .708l-1.5 1.5a.5.5 0 01-.708-.708L4.5 3.914V17.5zM9 2a1 1 0 011 1v14a1 1 0 11-2 0V3a1 1 0 011-1zm4 0a1 1 0 011 1v14a1 1 0 11-2 0V3a1 1 0 011-1zm4 0a1 1 0 011 1v14a1 1 0 11-2 0V3a1 1 0 011-1z" />
                  </svg>
                  Pinned Windows
                </h3>
                <div className={layout === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
                  : "space-y-4 mb-8"
                }>
                  {pinnedCards.map((card) => (
                    <WindowCard
                      key={card.id}
                      card={card}
                      layout={layout}
                      onCreateChat={createNewConversation}
                      openFeatureWindowChat={openFeatureWindowChat}
                      isPinned={true}
                      onUnpin={() => unpinWindow(card.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* All Windows Section */}
            <h3 className="text-lg font-semibold text-text-primary mb-3">All Windows</h3>
            <div className={layout === 'grid'
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }>
              {unpinnedCards.map((card) => (
                <WindowCard
                  key={card.id}
                  card={card}
                  layout={layout}
                  onCreateChat={createNewConversation}
                  openFeatureWindowChat={openFeatureWindowChat}
                  isPinned={false}
                  onPin={() => pinWindow(card.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Chat Hub View (if you want a separate view for the main chat) */}
        {activeTab === 'chat' && activeConversation && (
          <UniversalChatInterface
            windowId="main-chat"
            windowTitle="Chat Hub"
            onBackToDashboard={() => setActiveTab('dashboard')}
            // Enable web search for the main chat hub
            enableWebSearch={true}
          />
        )}

        {/* Feature Window Chat View (Notes, Tasks, News, etc. in chat mode) */}
        {activeTab === 'feature-chat' && activeFeatureWindow && (
          <UniversalChatInterface
            windowId={activeFeatureWindow.id}
            windowTitle={activeFeatureWindow.title}
            onBackToDashboard={handleBackToDashboard}
            // Flags for specific window behaviors
            isNewsWindow={activeFeatureWindow.id === 'news'}
            isTaskManager={activeFeatureWindow.id === 'tasks'}
            isNotesWindow={activeFeatureWindow.id === 'notes'}
            // Enable web search for ALL feature chats
            enableWebSearch={true}
            // Function to render special UI elements for specific windows
            renderSpecialUI={() => {
              if (activeFeatureWindow.id === 'tasks') {
                return (
                  <div className="bg-bg-secondary border-b border-border p-3">
                    <h3 className="text-md font-semibold text-text-primary mb-2">Task Manager</h3>
                    <p className="text-text-secondary text-sm">Task management controls are available in the full Task Manager view.</p>
                    <button
                      onClick={() => {
                        setActiveTab('tasks-full');
                        handleBackToDashboard(); // Close the chat view
                      }}
                      className="mt-2 text-accent hover:text-accent-hover text-sm font-medium"
                    >
                      Open Full Task Manager
                    </button>
                  </div>
                );
              }
              if (activeFeatureWindow.id === 'notes') {
                return (
                  <div className="bg-bg-secondary border-b border-border p-3">
                    <h3 className="text-md font-semibold text-text-primary mb-2">Block Notes</h3>
                    <p className="text-text-secondary text-sm">Note editing is available in the full Notes view.</p>
                    <button
                      onClick={() => {
                        setActiveTab('notes-full');
                        handleBackToDashboard(); // Close the chat view
                      }}
                      className="mt-2 text-accent hover:text-accent-hover text-sm font-medium"
                    >
                      Open Full Notes
                    </button>
                  </div>
                );
              }
              return null;
            }}
          />
        )}

        {/* Full Page Views for specific features */}
        {activeTab === 'notes-full' && (
          <NotesSection />
        )}

        {activeTab === 'tasks-full' && (
          <TaskManager />
        )}

        {/* Placeholder for other unimplemented views */}
        {activeTab !== 'dashboard' &&
          activeTab !== 'chat' &&
          activeTab !== 'feature-chat' &&
          activeTab !== 'notes-full' &&
          activeTab !== 'tasks-full' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-bg-primary">
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                {allWindowCards.find(c => c.id === activeTab)?.title || 'Feature'}
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

// --- WindowCard Component ---
// This component renders an individual window card on the dashboard.
const WindowCard = ({ card, layout, onCreateChat, openFeatureWindowChat, isPinned, onPin, onUnpin }) => {

  // Handler for when a window card is clicked
  const handleCardClick = () => {
    if (card.id === 'chat') {
      // For the main chat hub, create a new conversation
      onCreateChat();
    } else if (['notes', 'tasks', 'news', 'crypto', 'fitness', 'prompts'].includes(card.id) || card.isCustom) {
      // For other feature windows, open them in the universal chat interface
      openFeatureWindowChat(card.id, card.title);
    } else {
      // Fallback for any other unhandled window types
      alert(`${card.title} view is not yet implemented.`);
    }
  };

  return (
    <div
      className={`bg-bg-secondary rounded-2xl shadow-md border border-border overflow-hidden transition-all duration-200 hover:shadow-lg ${
        layout === 'grid'
          ? 'cursor-pointer flex flex-col h-full'
          : 'cursor-pointer flex items-center p-4'
        } ${isPinned ? 'ring-2 ring-accent' : ''}`}
      onClick={handleCardClick}
    >
      {layout === 'grid' ? (
        // Grid Layout for the window card
        <>
          {/* Accent color bar at the top */}
          <div className={`h-2 ${card.accentColor}`}></div>
          <div className="p-5 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-text-primary truncate">{card.title}</h3>
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
            <div className="flex justify-between items-center">
              <button
                onClick={(e) => {
                  // Stop the click event from propagating to the card's onClick
                  e.stopPropagation();
                  if (isPinned) {
                    onUnpin(); // Unpin the window
                  } else {
                    onPin(); // Pin the window
                  }
                }}
                className={`text-xs px-2 py-1 rounded ${
                  isPinned
                    ? 'bg-accent text-white'
                    : 'bg-bg-primary border border-border text-text-secondary hover:bg-bg-secondary'
                  }`}
              >
                {isPinned ? 'Pinned' : 'Pin'}
              </button>
              <button
                className={`py-2 px-4 rounded-lg text-sm font-medium text-white ${card.accentColor} hover:opacity-90 transition`}
              >
                {card.id === 'chat' ? 'New Chat' : 'Open Window'}
              </button>
            </div>
          </div>
        </>
      ) : (
        // List Layout for the window card
        <>
          <div className={`w-1 h-full ${card.accentColor} mr-4`}></div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-text-primary truncate">{card.title}</h3>
              <div className="flex space-x-2 ml-2">
                {card.isNew && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                    New
                  </span>
                )}
                {card.xp > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                    {card.xp} XP
                  </span>
                )}
              </div>
            </div>
            <p className="text-text-secondary text-sm mt-1 truncate">{card.description}</p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isPinned) {
                  onUnpin();
                } else {
                  onPin();
                }
              }}
              className={`text-xs px-2 py-1 rounded ${
                isPinned
                  ? 'bg-accent text-white'
                  : 'bg-bg-primary border border-border text-text-secondary hover:bg-bg-secondary'
                }`}
            >
              {isPinned ? 'Pinned' : 'Pin'}
            </button>
            <button
              className={`py-1 px-3 rounded-lg text-sm font-medium text-white ${card.accentColor} hover:opacity-90 transition`}
            >
              {card.id === 'chat' ? 'Chat' : 'Open'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
// --- End of WindowCard Component ---

export default App;
