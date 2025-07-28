const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  startMonitoring, 
  stopMonitoring, 
  getNotifications 
} = require('../controllers/searchController');

const router = express.Router();

router.post('/monitor', protect, startMonitoring);
router.delete('/monitor', protect, stopMonitoring);
router.get('/notifications', protect, getNotifications);

module.exports = router;