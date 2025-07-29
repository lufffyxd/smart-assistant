// server/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import existing routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notesRoutes = require('./routes/notesRoutes'); // Import notes routes

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Increase payload limit if needed for large requests or file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Serve static files from client/dist in production ---
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // Serve index.html for any non-API routes in production
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
  });
}
// --- End of static file serving ---

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
app.use('/api/notes', notesRoutes); // Add notes routes

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Catch-all route for undefined API endpoints (404)
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
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