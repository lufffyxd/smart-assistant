const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  getConversations, 
  createConversation, 
  getMessages, 
  sendMessage 
} = require('../controllers/chatController');

const router = express.Router();

router.route('/conversations')
  .get(protect, getConversations)
  .post(protect, createConversation);

router.route('/conversations/:id/messages')
  .get(protect, getMessages)
  .post(protect, sendMessage);

module.exports = router;