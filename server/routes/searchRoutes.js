// server/routes/searchRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { searchNews, startMonitoring, stopMonitoring } = require('../controllers/searchController');

const router = express.Router();

// Public endpoint for news search (consider if auth is needed)
// For simplicity, we'll make it protected like other features
router.get('/news', protect, searchNews);

// TODO: Implement monitoring endpoints
// These would typically involve setting up background jobs/schedulers
// router.post('/monitor', protect, startMonitoring);
// router.delete('/monitor', protect, stopMonitoring);

module.exports = router;