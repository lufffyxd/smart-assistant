// client/src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardProvider } from './context/DashboardContext'; // Import DashboardProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <DashboardProvider> {/* Wrap App with DashboardProvider */}
          <App />
        </DashboardProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);