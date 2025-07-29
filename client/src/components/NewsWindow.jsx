// client/src/components/NewsWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const NewsWindow = () => {
  const [topic, setTopic] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [notificationTopic, setNotificationTopic] = useState('');
  const intervalRef = useRef(null);

  // Load any existing notifications from localStorage or backend
  useEffect(() => {
    const savedNotifications = localStorage.getItem('newsNotifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('newsNotifications', JSON.stringify(notifications));
  }, [notifications]);

  const searchNews = async (searchTopic) => {
    if (!searchTopic.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // This would call your backend endpoint that uses RapidAPI
      const res = await api.get(`/search/news?topic=${encodeURIComponent(searchTopic)}`);
      setArticles(res.data.articles || []);
      setTopic(searchTopic);
    } catch (err) {
      console.error('Error searching news:', err);
      setError('Failed to fetch news. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startMonitoring = async () => {
    if (!notificationTopic.trim()) return;
    
    try {
      // This would call your backend to start monitoring
      await api.post('/search/monitor', { topic: notificationTopic });
      setIsMonitoring(true);
      
      // Start polling for new articles every 10 minutes (600000 ms)
      intervalRef.current = setInterval(async () => {
        try {
          const res = await api.get(`/search/news?topic=${encodeURIComponent(notificationTopic)}`);
          const newArticles = res.data.articles || [];
          
          // Check for truly new articles (this is a simplified check)
          if (newArticles.length > 0) {
            const latestArticle = newArticles[0];
            const isNew = !notifications.some(n => n.title === latestArticle.title);
            
            if (isNew) {
              const notification = {
                id: Date.now(),
                title: latestArticle.title,
                message: `New article found for topic: ${notificationTopic}`,
                timestamp: new Date().toISOString()
              };
              setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
            }
          }
        } catch (err) {
          console.error('Error fetching notifications:', err);
        }
      }, 600000); // 10 minutes
      
    } catch (err) {
      console.error('Error starting monitoring:', err);
      setError('Failed to start monitoring. Please try again.');
    }
  };

  const stopMonitoring = async () => {
    try {
      // This would call your backend to stop monitoring
      await api.delete('/search/monitor');
      setIsMonitoring(false);
      setNotificationTopic('');
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (err) {
      console.error('Error stopping monitoring:', err);
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col p-6 bg-bg-primary overflow-hidden">
      <h2 className="text-2xl font-bold text-text-primary mb-6">News & Search</h2>
      
      {/* Search Section */}
      <div className="bg-bg-secondary rounded-lg p-4 border border-border shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-3">Search News</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter a topic to search for news..."
            className="flex-1 p-2 rounded border border-border bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchNews(topic)}
          />
          <button
            onClick={() => searchNews(topic)}
            disabled={loading}
            className="bg-accent text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-accent-hover transition disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {error && (
          <p className="text-red-500 mt-2">{error}</p>
        )}
      </div>
      
      {/* Notification Monitoring Section */}
      <div className="bg-bg-secondary rounded-lg p-4 border border-border shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-3">News Notifications</h3>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <input
            type="text"
            placeholder="Enter a topic to monitor..."
            className="flex-1 p-2 rounded border border-border bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={notificationTopic}
            onChange={(e) => setNotificationTopic(e.target.value)}
            disabled={isMonitoring}
          />
          {isMonitoring ? (
            <button
              onClick={stopMonitoring}
              className="bg-red-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-600 transition"
            >
              Stop Monitoring
            </button>
          ) : (
            <button
              onClick={startMonitoring}
              className="bg-accent text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-accent-hover transition"
            >
              Start Monitoring
            </button>
          )}
        </div>
        <p className="text-text-secondary text-sm mt-2">
          {isMonitoring 
            ? `Monitoring for news on "${notificationTopic}" every 10 minutes.` 
            : 'Get notified when new articles are published on a specific topic.'}
        </p>
      </div>
      
      {/* Notifications List */}
      {notifications.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-3">Recent Notifications</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {notifications.map(notification => (
              <div key={notification.id} className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{notification.title}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{notification.message}</p>
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Articles List */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-lg font-semibold text-text-primary mb-3">
          {topic ? `News for "${topic}"` : 'Latest News'}
        </h3>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="spinner"></div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-text-secondary">
              {topic 
                ? 'No articles found for this topic. Try a different search.' 
                : 'Search for a topic to see news articles.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((article, index) => (
              <a
                key={index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-bg-secondary rounded-lg p-4 border border-border shadow-sm hover:shadow-md transition block"
              >
                {article.image && (
                  <img 
                    src={article.image} 
                    alt={article.title} 
                    className="w-full h-40 object-cover rounded mb-3"
                  />
                )}
                <h4 className="font-semibold text-text-primary line-clamp-2">{article.title}</h4>
                <p className="text-text-secondary text-sm mt-2 line-clamp-3">{article.description}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-text-secondary">{article.source}</span>
                  <span className="text-xs text-text-secondary">
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsWindow;