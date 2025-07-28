import React, { useState, useEffect } from 'react';
import api from '../services/api';

const NotificationsSection = () => {
  const [topic, setTopic] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = async () => {
    if (!topic.trim()) return;
    
    try {
      await api.post('/search/monitor', { topic });
      setIsMonitoring(true);
      loadNotifications();
    } catch (error) {
      console.error('Error starting monitoring:', error);
    }
  };

  const stopMonitoring = async () => {
    try {
      await api.delete('/search/monitor');
      setIsMonitoring(false);
      setTopic('');
    } catch (error) {
      console.error('Error stopping monitoring:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get('/search/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    const interval = setInterval(() => {
      if (isMonitoring) {
        loadNotifications();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [isMonitoring]);

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">AI Notifications</h2>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic to monitor"
              className="border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isMonitoring}
            />
            {isMonitoring ? (
              <button
                onClick={stopMonitoring}
                className="bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition"
              >
                Stop Monitoring
              </button>
            ) : (
              <button
                onClick={startMonitoring}
                className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                Start Monitoring
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">Recent Updates</h3>
          
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h4 className="text-lg font-medium text-gray-800 mb-2">No notifications yet</h4>
              <p className="text-gray-600">Set up a topic to start receiving AI-powered updates</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map(notification => (
                <div key={notification._id} className="border-l-4 border-indigo-500 pl-4 py-2">
                  <p className="text-gray-800">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsSection;