const axios = require('axios');
const Notification = require('../models/Notification');

const searchWeb = async (query) => {
  const options = {
    method: 'GET',
    url: 'https://contextualwebsearch-websearch-v1.p.rapidapi.com/api/Search/WebSearchAPI',
    params: {
      q: query,
      pageNumber: '1',
      pageSize: '10',
      autoCorrect: 'true',
      safeSearch: 'false'
    },
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'contextualwebsearch-websearch-v1.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    return response.data.value.map(item => ({
      title: item.title,
      snippet: item.description,
      url: item.url
    }));
  } catch (error) {
    throw new Error('Web search failed');
  }
};

const startMonitoring = async (req, res) => {
  try {
    // In a real implementation, you would set up a cron job or background task
    // For now, we'll just save the topic to the user's profile
    req.user.monitoringTopic = req.body.topic;
    await req.user.save();
    
    res.json({ message: 'Monitoring started' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const stopMonitoring = async (req, res) => {
  try {
    req.user.monitoringTopic = null;
    await req.user.save();
    
    res.json({ message: 'Monitoring stopped' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// This would be called by a background job every 10 minutes
const checkForUpdates = async () => {
  // In a real implementation, you would:
  // 1. Get all users with monitoring topics
  // 2. Search for updates on each topic
  // 3. Create notifications for new results
  // 4. Send push notifications or emails
};

module.exports = {
  searchWeb,
  startMonitoring,
  stopMonitoring,
  getNotifications,
  checkForUpdates
};