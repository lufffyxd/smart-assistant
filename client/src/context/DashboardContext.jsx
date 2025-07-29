// client/src/context/DashboardContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const [pinnedWindows, setPinnedWindows] = useState(() => {
    const saved = localStorage.getItem('pinnedWindows');
    return saved ? JSON.parse(saved) : [];
  });

  const [layout, setLayout] = useState(() => {
    return localStorage.getItem('dashboardLayout') || 'grid'; // 'grid' or 'list'
  });

  const [customWindows, setCustomWindows] = useState(() => {
    const saved = localStorage.getItem('customWindows');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pinnedWindows', JSON.stringify(pinnedWindows));
  }, [pinnedWindows]);

  useEffect(() => {
    localStorage.setItem('dashboardLayout', layout);
  }, [layout]);

  useEffect(() => {
    localStorage.setItem('customWindows', JSON.stringify(customWindows));
  }, [customWindows]);

  const pinWindow = (windowId) => {
    if (pinnedWindows.length < 3 && !pinnedWindows.includes(windowId)) {
      setPinnedWindows(prev => [...prev, windowId]);
    }
  };

  const unpinWindow = (windowId) => {
    setPinnedWindows(prev => prev.filter(id => id !== windowId));
  };

  const toggleLayout = () => {
    setLayout(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const addCustomWindow = (windowData) => {
    const newWindow = {
      id: `custom-${Date.now()}`,
      ...windowData,
      isCustom: true,
      xp: 0,
      isNew: true
    };
    setCustomWindows(prev => [...prev, newWindow]);
    return newWindow;
  };

  const removeCustomWindow = (windowId) => {
    setCustomWindows(prev => prev.filter(w => w.id !== windowId));
    // Also unpin if it was pinned
    if (pinnedWindows.includes(windowId)) {
      unpinWindow(windowId);
    }
  };

  return (
    <DashboardContext.Provider value={{
      pinnedWindows,
      layout,
      customWindows,
      pinWindow,
      unpinWindow,
      toggleLayout,
      addCustomWindow,
      removeCustomWindow
    }}>
      {children}
    </DashboardContext.Provider>
  );
};