// server/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import existing routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Import new/updated routes
const notesRoutes = require('./routes/notesRoutes');
const tasksRoutes = require('./routes/tasksRoutes');
const searchRoutes = require('./routes/searchRoutes');
const newsRoutes = require('./routes/newsRoutes'); // Add this import

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit if needed for large requests
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  // Consider exiting the process if DB connection is critical
  // process.exit(1); 
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/news', newsRoutes); // Add the news routes

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling middleware (should be last)
app.use((err, req, res, next) => {
  console.error("Global error handler caught an error:", err.stack);
  
  // Determine status code
  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  
  // Send JSON response
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    // stack: process.env.NODE_ENV === 'production' ? null : err.stack // Hide stack in prod
  });
});

// Handle 404 for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});