// server/controllers/chatController.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
// Import the OpenRouter utility function
const { callOpenRouter } = require('../utils/openRouter');
// Import the web search function (LangSearch)
const { searchWeb } = require('../utils/webSearch'); // Updated import

// --- Controller Functions ---

// @desc    Get all conversations for a user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(conversations);
  } catch (error) {
    console.error('[Chat Controller] Error in getConversations:', error);
    res.status(500).json({ message: 'Server error while fetching conversations' });
  }
};

// @desc    Create a new conversation
// @route   POST /api/chat/conversations
// @access  Private
const createConversation = async (req, res) => {
  try {
    const { title, windowId } = req.body; // Accept optional windowId

    const conversationData = {
      userId: req.user._id,
      title: title || 'New Chat'
    };

    // If a windowId is provided, associate the conversation with it
    if (windowId) {
      conversationData.windowId = windowId;
    }

    const conversation = await Conversation.create(conversationData);
    res.status(201).json(conversation);
  } catch (error) {
    console.error('[Chat Controller] Error in createConversation:', error);
    res.status(500).json({ message: 'Server error while creating conversation' });
  }
};

// @desc    Get messages for a conversation with pagination
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    // Get pagination parameters from query string, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const conversationId = req.params.id;

    // Ensure page and limit are positive
    if (page < 1 || limit < 1) {
        return res.status(400).json({ message: 'Page and limit must be positive integers.' });
    }

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Fetch messages with pagination
    // Sort by createdAt ASC to get the oldest messages first for correct pagination display
    // The frontend will reverse them for display (newest at bottom)
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 }) // ASC order
      .skip(skip)
      .limit(limit);

    // Get total count for pagination info
    const totalMessages = await Message.countDocuments({ conversationId });
    const totalPages = Math.ceil(totalMessages / limit);

    res.json({
      messages,
      pagination: {
        currentPage: page,
        totalPages,
        totalMessages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        // You can include these if the frontend needs them
        // messagesPerPage: limit,
        // messagesReturned: messages.length
      }
    });
  } catch (error) {
    console.error('[Chat Controller] Error in getMessages:', error);
    res.status(500).json({ message: 'Server error while fetching messages' });
  }
};


// @desc    Send a message in a conversation and get AI response
// @route   POST /api/chat/conversations/:id/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    // Extract text and the new searchEnabled flag from the request body
    const { text, searchEnabled } = req.body;
    const conversationId = req.params.id;

    console.log(`[Chat Controller] Sending message in conversation ${conversationId}: "${text}" (Search: ${searchEnabled})`);

    // 1. Save the user's message to the database
    const userMessage = await Message.create({
      conversationId,
      text,
      sender: 'user'
    });

    // 2. Get recent conversation context (last 10 messages)
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(10);

    // 3. Format context for the AI model
    const context = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    let searchResults = [];
    // 4. If web search is enabled for this message, perform the search
    if (searchEnabled) {
      try {
        console.log(`[Chat Controller] Web search enabled, searching for: "${text}"`);
        // Refine the search query if needed, limit length
        const searchQuery = text.substring(0, 100);
        // Call the searchWeb function (now using LangSearch)
        const searchData = await searchWeb(searchQuery, 3); // Get top 3 results
        searchResults = searchData.articles || [];
        console.log(`[Chat Controller] Web search completed. Found ${searchResults.length} results.`);
      } catch (searchError) {
        // Log the search error but don't fail the chat message
        console.error('[Chat Controller] Web search failed:', searchError.message);
        // Proceed with AI response without search results
        searchResults = [];
      }
    }

    // 5. Call the AI service (OpenRouter) with context and optional search results
    console.log(`[Chat Controller] Calling AI service with ${context.length} context messages and ${searchResults.length} search results.`);
    const aiResponse = await callOpenRouter(context, searchResults);

    // 6. Save the AI's response to the database
    const aiMessage = await Message.create({
      conversationId,
      text: aiResponse,
      sender: 'ai',
      // Optionally store search results if needed for UI features later
      // searchResults: searchResults.slice(0, 3) 
    });

    console.log(`[Chat Controller] AI response saved successfully.`);
    // 7. Send the AI's message back to the frontend
    res.json(aiMessage);
  } catch (error) {
    console.error('[Chat Controller] Error in sendMessage:', error);
    res.status(500).json({ 
      message: error.message || 'Internal server error while processing your message' 
    });
  }
};
// --- END OF UPDATED sendMessage Function ---

module.exports = {
  getConversations,
  createConversation,
  getMessages, // Export the updated function
  sendMessage // Export the updated function
};