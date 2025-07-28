const mongoose = require('mongoose');

const customPromptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomPrompt', customPromptSchema);