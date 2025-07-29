// server/routes/newsRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  saveNewsQuery,
  getNewsQuery,
  deleteNewsQuery,
  fetchNewsForChat
} = require('../controllers/newsController');

const router = express.Router();

// All routes protected by authentication
router.route('/queries')
  .post(protect, saveNewsQuery)   // POST /api/news/queries
  .get(protect, getNewsQuery)     // GET /api/news/queries?windowId=...
  .delete(protect, deleteNewsQuery); // DELETE /api/news/queries?windowId=...

router.route('/fetch')
  .post(protect, fetchNewsForChat); // POST /api/news/fetch

module.exports = router;