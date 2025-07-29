// client/src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardProvider } from './context/DashboardContext';
import { NewsProvider } from './context/NewsContext';

// Ensure AuthProvider is at the root so App can access auth state
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <DashboardProvider>
          <NewsProvider>
            <App />
          </NewsProvider>
        </DashboardProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
