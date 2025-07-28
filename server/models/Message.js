const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  searchResults: [{
    title: String,
    snippet: String,
    url: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);