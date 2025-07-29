// client/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api'; // Import your api instance

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
  const [loading, setLoading] = useState(true); // Loading state for initial check

  useEffect(() => {
    console.log("AuthProvider: Checking for existing token on initial load.");
    const token = localStorage.getItem('token');
    if (token) {
      console.log("AuthProvider: Token found, setting default header.");
      // Set the default authorization header for all api calls
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Optionally, you could verify the token here by making a small API call
      // For now, we'll assume the token is valid and set a placeholder user
      // A more robust approach would be to fetch user data from /api/auth/me
      // and set the user state based on that response.
      // Example:
      /*
      api.get('/auth/me')
         .then(res => {
           setUser(res.data.user);
           setLoading(false);
         })
         .catch(err => {
           console.error("AuthProvider: Failed to fetch user data, token might be invalid:", err);
           // If token is invalid, remove it and proceed as logged out
           localStorage.removeItem('token');
           delete api.defaults.headers.common['Authorization'];
           setLoading(false);
         });
      */
      // For simplicity and matching your current structure, let's assume a valid token means logged in
      // You'll need a more robust user object, perhaps fetched from the backend
      // This is a placeholder, replace with actual user data fetching
      setUser({ id: 'user_id_from_token_or_api', email: 'user@example.com' }); 
      setLoading(false);
    } else {
      console.log("AuthProvider: No token found.");
      setLoading(false);
    }
  }, []); // Run only once on component mount

  const login = async (email, password) => {
    console.log("AuthProvider: Attempting login for:", email);
    try {
      const res = await api.post('/auth/login', { email, password });
      console.log("AuthProvider: Login response received:", res.data);

      const { token, user: userData } = res.data;

      if (!token || !userData) {
        console.error("AuthProvider: Login response missing token or user data:", res.data);
        return { success: false, message: 'Invalid response from server' };
      }

      localStorage.setItem('token', token);
      // Set the default authorization header for subsequent api calls
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log("AuthProvider: Setting user state in context to:", userData);
      setUser(userData); 
      
      return { success: true };
    } catch (error) {
      console.error('AuthProvider: Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      // Ensure user state is cleared on login failure
      setUser(null);
      return { success: false, message };
    }
  };

  const signup = async (email, password) => {
    console.log("AuthProvider: Attempting signup for:", email);
    try {
      const res = await api.post('/auth/signup', { email, password });
      console.log("AuthProvider: Signup response received:", res.data);

      const { token, user: userData } = res.data;

      if (!token || !userData) {
        console.error("AuthProvider: Signup response missing token or user data:", res.data);
        return { success: false, message: 'Invalid response from server' };
      }

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log("AuthProvider: Setting user state in context to:", userData);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('AuthProvider: Signup error:', error);
      const message = error.response?.data?.message || 'Signup failed';
      // Ensure user state is cleared on signup failure
      setUser(null);
      return { success: false, message };
    }
  };

  const logout = () => {
    console.log("AuthProvider: Logging out user.");
    localStorage.removeItem('token');
    // Remove the default authorization header
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading // Expose loading state
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
