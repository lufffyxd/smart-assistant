// server/routes/notesRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  getNotes, 
  createNote, 
  updateNote, 
  deleteNote 
} = require('../controllers/notesController');

const router = express.Router();

// All routes protected by authentication
router.route('/')
  .get(protect, getNotes)      // GET /api/notes
  .post(protect, createNote);  // POST /api/notes

router.route('/:id')
  .put(protect, updateNote)    // PUT /api/notes/:id
  .delete(protect, deleteNote); // DELETE /api/notes/:id

module.exports = router;