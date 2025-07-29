// server/routes/notesRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotesByWindow,
  createNote,
  getNoteById,
  addPage,
  updatePage,
  deletePage
} = require('../controllers/notesController');

// Apply protection middleware to all routes in this router
router.use(protect);

// --- Updated Routes ---

// GET /api/notes/window/:windowId - Get notes for a specific window or main notes
// Example: GET /api/notes/window/my-custom-chat-123
// Example: GET /api/notes/window/main (for Block Note)
router.get('/window/:windowId', getNotesByWindow);

// POST /api/notes - Create a new note entity (for a window or main)
// Expects { windowId: "..." } in body, or empty for main notes
router.post('/', createNote);

// GET /api/notes/:id - Get a specific note by its ID
router.get('/:id', getNoteById);

// POST /api/notes/:id/pages - Add a new page to a note
router.post('/:id/pages', addPage);

// PUT /api/notes/:id/pages/:pageId - Update a specific page
router.put('/:id/pages/:pageId', updatePage);

// DELETE /api/notes/:id/pages/:pageId - Delete a specific page
router.delete('/:id/pages/:pageId', deletePage);

// --- Removed Routes ---
// Routes for updating/deleting the entire Note entity are removed
// as the focus is on pages and window-specific notes.
// You can add them back if needed:
// router.route('/:id').put(updateNote).delete(deleteNote);

module.exports = router;
