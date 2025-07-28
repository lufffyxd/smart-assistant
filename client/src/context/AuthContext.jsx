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
      // Example (uncomment and implement backend endpoint if needed):
      /*
      api.get('/auth/me')
         .then(res => {
           // Ensure the user object structure matches what App expects (id, email)
           setUser({ id: res.data._id, email: res.data.email });
           setLoading(false);
         })
         .catch(err => {
           console.error("Failed to fetch user data on load:", err);
           localStorage.removeItem('token');
           delete api.defaults.headers.common['Authorization'];
           setLoading(false);
         });
      */
      // For simplicity, and because login/signup now correctly set the user state,
      // we just finish loading. The actual user state should be set by login/signup.
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    console.log("Attempting login for:", email);
    try {
      const res = await api.post('/auth/login', { email, password });
      console.log("Login response received:", res.data);

      // --- CORRECTED DESTRUCTURING BASED ON ACTUAL BACKEND RESPONSE ---
      // Backend sends { _id, email, token } at the top level
      const { token, _id, email: responseEmail } = res.data;

      // Basic validation
      if (!token || !_id) {
        console.error("Login response missing token or user ID:", res.data);
        return { success: false, message: 'Invalid response from server' };
      }

      // --- CREATE A USER OBJECT THAT MATCHES YOUR FRONTEND EXPECTATIONS ---
      // The frontend components expect user.id and user.email
      const userData = {
        id: _id,               // Map _id from backend to id for frontend
        email: responseEmail   // Use the email from the response
        // Add other properties if your frontend expects them and backend sends them
      };

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

      // --- CORRECTED DESTRUCTURING BASED ON ACTUAL BACKEND RESPONSE ---
      // Assuming backend sends { _id, email, token } upon signup as well
      const { token, _id, email: responseEmail } = res.data;

      // Basic validation
      if (!token || !_id) {
        console.error("Signup response missing token or user ID:", res.data);
        return { success: false, message: 'Invalid response from server' };
      }

      // --- CREATE A USER OBJECT ---
      const userData = {
        id: _id,
        email: responseEmail
        // Add other properties if needed
      };

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      console.log("Setting user state in context to:", userData);
      setUser(userData);

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
