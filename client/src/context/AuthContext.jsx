// client/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log("AuthProvider: Checking for existing token on initial load.");
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // In a real app, you'd verify the token here by fetching user data
      // For now, we'll assume a valid token means a valid user.
      // A more robust approach would be to fetch user data from /api/auth/me
      // and set the user state based on that response.
      // setUser({ id: 1, email: 'user@example.com' }); // Placeholder from before
      // Let's assume if token exists, we are logged in, but user data needs to be fetched
      // or we need a more definitive check. For now, let's just set loading to false
      // if a token exists, and rely on login/signup to set the user.
      // A better approach for persistence would be:
      /*
      api.get('/auth/me')
         .then(res => {
           setUser(res.data.user);
           setLoading(false);
         })
         .catch(err => {
           console.error("Failed to fetch user data on load:", err);
           localStorage.removeItem('token');
           delete api.defaults.headers.common['Authorization'];
           setLoading(false);
         });
      */
      // For simplicity and matching your current structure, we'll proceed as before
      // but make sure login correctly updates the state.
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    console.log("Attempting login for:", email);
    try {
      const res = await api.post('/auth/login', { email, password });
      console.log("Login response received:", res.data);
      
      const { token, user: userData } = res.data;
      
      // Basic validation
      if (!token || !userData) {
        console.error("Login response missing token or user data:", res.data);
        return { success: false, message: 'Invalid response from server' };
      }

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log("Setting user state in context to:", userData);
      setUser(userData); // This should trigger a re-render in App.jsx
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      // Ensure user state is cleared on login failure
      setUser(null);
      return { success: false, message };
    }
  };

  const signup = async (email, password) => {
    console.log("Attempting signup for:", email);
    try {
      const res = await api.post('/auth/signup', { email, password });
      console.log("Signup response received:", res.data);
      
      const { token, user: userData } = res.data;
      
      // Basic validation
      if (!token || !userData) {
        console.error("Signup response missing token or user data:", res.data);
        return { success: false, message: 'Invalid response from server' };
      }

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log("Setting user state in context to:", userData);
      setUser(userData); // This should trigger a re-render in App.jsx
      
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      const message = error.response?.data?.message || 'Signup failed';
      // Ensure user state is cleared on signup failure
      setUser(null);
      return { success: false, message };
    }
  };

  const logout = () => {
    console.log("Logging out user.");
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null); // Explicitly set to null
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  };

  // Add a debug log to see context value changes (be careful with this in production)
  // console.log("AuthContext value:", value);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};