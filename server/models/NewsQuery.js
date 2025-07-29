// server/models/NewsQuery.js
const mongoose = require('mongoose');

const newsQuerySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  windowId: {
    type: String, // e.g., 'news-window-123'
    required: true
  },
  lastFetched: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient lookups
newsQuerySchema.index({ userId: 1, windowId: 1 });
newsQuerySchema.index({ isActive: 1 });

module.exports = mongoose.model('NewsQuery', newsQuerySchema);