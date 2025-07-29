// client/src/context/NewsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const NewsContext = createContext();

export const useNews = () => {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};

export const NewsProvider = ({ children }) => {
  const [newsQueries, setNewsQueries] = useState({});

  // Load a saved news query for a specific window
  const loadNewsQuery = async (windowId) => {
    try {
      const res = await api.get(`/news/queries?windowId=${windowId}`);
      if (res.data && res.data.topic) {
        setNewsQueries(prev => ({
          ...prev,
          [windowId]: res.data
        }));
        return res.data;
      }
      return null;
    } catch (error) {
      console.error(`Error loading news query for window ${windowId}:`, error);
      return null;
    }
  };

  // Save a news query for a specific window
  const saveNewsQuery = async (windowId, topic) => {
    try {
      const res = await api.post('/news/queries', { windowId, topic });
      setNewsQueries(prev => ({
        ...prev,
        [windowId]: res.data
      }));
      return res.data;
    } catch (error) {
      console.error(`Error saving news query for window ${windowId}:`, error);
      throw error;
    }
  };

  // Deactivate a news query for a specific window
  const deactivateNewsQuery = async (windowId) => {
    try {
      await api.delete(`/news/queries?windowId=${windowId}`);
      setNewsQueries(prev => {
        const updated = { ...prev };
        delete updated[windowId];
        return updated;
      });
    } catch (error) {
      console.error(`Error deactivating news query for window ${windowId}:`, error);
      throw error;
    }
  };

  return (
    <NewsContext.Provider value={{
      newsQueries,
      loadNewsQuery,
      saveNewsQuery,
      deactivateNewsQuery
    }}>
      {children}
    </NewsContext.Provider>
  );
};