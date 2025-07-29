// server/controllers/searchController.js
const { searchNews: fetchNews } = require('../utils/rapidApi');

// @desc    Search for news articles
// @route   GET /api/search/news?topic=:topic
// @access  Private
const searchNews = async (req, res) => {
  const { topic } = req.query;

  if (!topic) {
    return res.status(400).json({ message: 'Topic query parameter is required' });
  }

  try {
    const newsData = await fetchNews(topic);
    res.json(newsData);
  } catch (error) {
    console.error("Error in searchNews:", error);
    res.status(500).json({ 
      message: error.message || 'Server error while searching news' 
    });
  }
};

// TODO: Implement monitoring logic
// This would involve:
// 1. Saving the user's monitoring topic/preferences
// 2. Setting up a background job (e.g., using node-cron, bullmq, or a separate worker)
// 3. The job would periodically call fetchNews for the topic
// 4. If new articles are found, create a notification record for the user
// 5. Provide an endpoint for the frontend to fetch these notifications

const startMonitoring = async (req, res) => {
  // Placeholder implementation
  res.status(501).json({ message: 'News monitoring not yet implemented on backend' });
};

const stopMonitoring = async (req, res) => {
  // Placeholder implementation
  res.status(501).json({ message: 'News monitoring not yet implemented on backend' });
};

module.exports = {
  searchNews,
  startMonitoring,
  stopMonitoring
};