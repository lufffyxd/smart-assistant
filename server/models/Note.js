// server/models/Note.js
const mongoose = require('mongoose');

// Define a schema for individual note pages
const notePageSchema = new mongoose.Schema({
  title: { type: String, required: true, default: 'Untitled Page' },
  content: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Define the main Note schema
const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // windowId links a Note entity to a specific chat window or identifies it as the main Block Note
  // For the main Block Note window, this could be a fixed string like 'block-note-main'
  // For custom chat windows, it would be their unique ID
  windowId: { type: String, unique: true, sparse: true }, // Allows null/undefined, but if present, must be unique

  // Embed pages directly within the Note document
  pages: [notePageSchema],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true // This adds createdAt and updatedAt to the Note document itself
});

// Middleware to update the Note's updatedAt timestamp when pages are modified
// This might be a bit tricky with embedded docs, so we'll update it in the controller logic
// Alternatively, you can add a pre-save hook for the pages array if needed.

// Ensure indexes for efficient querying
noteSchema.index({ userId: 1 });
noteSchema.index({ windowId: 1 }); // For finding notes by window

module.exports = mongoose.model('Note', noteSchema);
