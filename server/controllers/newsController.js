// server/controllers/newsController.js
const NewsQuery = require('../models/NewsQuery');
const { searchNews } = require('../utils/rapidApi');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// @desc    Save a news query for monitoring
// @route   POST /api/news/queries
// @access  Private
const saveNewsQuery = async (req, res) => {
  const { topic, windowId } = req.body;

  if (!topic || !windowId) {
    return res.status(400).json({ message: 'Topic and windowId are required' });
  }

  try {
    // Check if query already exists for this user/window
    let query = await NewsQuery.findOne({ userId: req.user._id, windowId });
    
    if (query) {
      // Update existing query
      query.topic = topic;
      query.isActive = true;
      query.lastFetched = null; // Reset to fetch immediately
    } else {
      // Create new query
      query = new NewsQuery({
        userId: req.user._id,
        topic,
        windowId
      });
    }
    
    const savedQuery = await query.save();
    res.status(201).json(savedQuery);
  } catch (error) {
    console.error("Error in saveNewsQuery:", error);
    res.status(500).json({ message: 'Server error while saving news query' });
  }
};

// @desc    Get saved news queries for a window
// @route   GET /api/news/queries?windowId=:windowId
// @access  Private
const getNewsQuery = async (req, res) => {
  const { windowId } = req.query;

  if (!windowId) {
    return res.status(400).json({ message: 'windowId query parameter is required' });
  }

  try {
    const query = await NewsQuery.findOne({ 
      userId: req.user._id, 
      windowId 
    });
    res.json(query || {});
  } catch (error) {
    console.error("Error in getNewsQuery:", error);
    res.status(500).json({ message: 'Server error while fetching news query' });
  }
};

// @desc    Deactivate a news query
// @route   DELETE /api/news/queries?windowId=:windowId
// @access  Private
const deleteNewsQuery = async (req, res) => {
  const { windowId } = req.query;

  if (!windowId) {
    return res.status(400).json({ message: 'windowId query parameter is required' });
  }

  try {
    const result = await NewsQuery.updateOne(
      { userId: req.user._id, windowId },
      { isActive: false }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'News query not found' });
    }
    
    res.json({ message: 'News query deactivated' });
  } catch (error) {
    console.error("Error in deleteNewsQuery:", error);
    res.status(500).json({ message: 'Server error while deactivating news query' });
  }
};

// @desc    Fetch news for a topic and return as chat messages
// @route   POST /api/news/fetch
// @access  Private
const fetchNewsForChat = async (req, res) => {
  const { topic, conversationId } = req.body;

  if (!topic) {
    return res.status(400).json({ message: 'Topic is required' });
  }

  try {
    // Save user message
    if (conversationId) {
      const userMessage = new Message({
        conversationId,
        text: `Find news about: ${topic}`,
        sender: 'user'
      });
      await userMessage.save();
    }

    // Fetch news
    const newsData = await searchNews(topic, 5); // Fetch 5 articles
    
    if (newsData.articles.length === 0) {
      const noResultsMessage = `I couldn't find any recent news articles about "${topic}". Please try a different search term or check back later.`;
      
      // Save AI message
      if (conversationId) {
        const aiMessage = new Message({
          conversationId,
          text: noResultsMessage,
          sender: 'ai'
        });
        await aiMessage.save();
      }
      
      return res.json({
        message: noResultsMessage,
        articles: []
      });
    }

    // Format articles as a response message
    let responseText = `Here are the latest news articles about "${topic}":\n\n`;
    newsData.articles.forEach((article, index) => {
      responseText += `${index + 1}. **${article.title}**\n`;
      responseText += `   ${article.description}\n`;
      responseText += `   Source: [${article.source}](${article.url})\n\n`;
    });

    // Save AI message
    if (conversationId) {
      const aiMessage = new Message({
        conversationId,
        text: responseText,
        sender: 'ai',
        searchResults: newsData.articles // Store raw articles for potential UI use
      });
      await aiMessage.save();
    }

    res.json({
      message: responseText,
      articles: newsData.articles
    });
    
  } catch (error) {
    console.error("Error in fetchNewsForChat:", error);
    const errorMessage = `Sorry, I encountered an error while searching for news about "${topic}". Please try again later.`;
    
    // Save error message
    if (conversationId) {
      const aiMessage = new Message({
        conversationId,
        text: errorMessage,
        sender: 'ai'
    });
      await aiMessage.save();
    }
    
    res.status(500).json({ 
      message: errorMessage
    });
  }
};

module.exports = {
  saveNewsQuery,
  getNewsQuery,
  deleteNewsQuery,
  fetchNewsForChat
};