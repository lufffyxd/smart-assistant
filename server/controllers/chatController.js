// server/controllers/chatController.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
// Import the OpenRouter utility function
const { callOpenRouter } = require('../utils/openRouter');
// Import the RapidAPI search function
const { searchNews } = require('../utils/rapidApi');

// --- Existing Controller Functions (getConversations, createConversation, getMessages) ---
// These functions remain unchanged from your previous implementation.
// I'm including placeholders to show the complete file structure.
// Please ensure your existing logic for these is preserved.

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

const createConversation = async (req, res) => {
  try {
    const conversation = await Conversation.create({
      userId: req.user._id,
      title: req.body.title
    });
    res.status(201).json(conversation);
  } catch (error) {
    console.error('[Chat Controller] Error in createConversation:', error);
    res.status(500).json({ message: 'Server error while creating conversation' });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.id })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error('[Chat Controller] Error in getMessages:', error);
    res.status(500).json({ message: 'Server error while fetching messages' });
  }
};

// --- UPDATED sendMessage Function ---
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
        // Call the searchNews function from rapidApi.js
        // This function now uses the Bing Search API
        const searchData = await searchNews(searchQuery, 3); // Get top 3 results
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
  getMessages,
  sendMessage // Export the updated function
};
