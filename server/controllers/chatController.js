const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { callOpenRouter } = require('../utils/openRouter');
const { searchWeb } = require('./searchController');

const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createConversation = async (req, res) => {
  try {
    const conversation = await Conversation.create({
      userId: req.user._id,
      title: req.body.title
    });
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.id })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { text, searchEnabled } = req.body;
    const conversationId = req.params.id;

    // Save user message
    const userMessage = await Message.create({
      conversationId,
      text,
      sender: 'user'
    });

    // Get conversation context
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(10); // Limit to last 10 messages for context

    // Prepare context for AI
    const context = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    let searchResults = [];
    if (searchEnabled) {
      try {
        searchResults = await searchWeb(text);
      } catch (error) {
        console.error('Search error:', error);
      }
    }

    // Call OpenRouter API
    const aiResponse = await callOpenRouter(context, searchResults);

    // Save AI message
    const aiMessage = await Message.create({
      conversationId,
      text: aiResponse,
      sender: 'ai',
      searchResults: searchResults.slice(0, 3) // Save top 3 results
    });

    res.json(aiMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getConversations,
  createConversation,
  getMessages,
  sendMessage
};