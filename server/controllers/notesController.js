// server/controllers/notesController.js
const Note = require('../models/Note');

// --- Helper Function ---
// Find or create a note entity for a specific window or user's main notes
async function findOrCreateNote(userId, windowId = null) {
  let query = { userId };
  if (windowId) {
    query.windowId = windowId;
  } else {
    // For main Block Note, use a specific identifier
    query.windowId = 'block-note-main';
  }

  let note = await Note.findOne(query);
  if (!note) {
    // If not found, create a new one
    // For main notes, create with a default page
    // For window-specific notes, maybe create empty or with a default page
    const pages = windowId ? [] : [{ title: 'Welcome', content: 'This is your first page!' }];
    note = new Note({
      userId,
      windowId: query.windowId,
      pages: pages
    });
    await note.save();
  }
  return note;
}
// --- End Helper Function ---

// @desc    Get notes for a specific window or main notes
// @route   GET /api/notes/window/:windowId
// @route   GET /api/notes/main (handled by windowId = 'block-note-main' or no windowId)
// @access  Private
const getNotesByWindow = async (req, res) => {
  try {
    const { windowId } = req.params;
    // If windowId is 'main' or undefined, use the special identifier
    const effectiveWindowId = windowId === 'main' || !windowId ? 'block-note-main' : windowId;

    const note = await Note.findOne({ userId: req.user._id, windowId: effectiveWindowId });

    if (!note) {
      return res.status(404).json({ message: 'Notes not found for this window.' });
    }

    res.json(note);
  } catch (error) {
    console.error("Error in getNotesByWindow:", error);
    res.status(500).json({ message: 'Server error while fetching notes.' });
  }
};

// @desc    Create a new note entity (potentially for a window)
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
  const { windowId } = req.body;

  try {
    let query = { userId: req.user._id };
    if (windowId) {
      query.windowId = windowId;
    } else {
      query.windowId = 'block-note-main';
    }

    let note = await Note.findOne(query);
    if (note) {
      return res.status(200).json(note);
    }

    const newNote = new Note({
      userId: req.user._id,
      windowId: query.windowId,
      pages: [{ title: 'New Page', content: 'Start writing here...' }]
    });

    const createdNote = await newNote.save();
    res.status(201).json(createdNote);

  } catch (error) {
    console.error("Error in createNote:", error);
    res.status(500).json({ message: 'Server error while creating notes.' });
  }
};

// @desc    Get a specific note by ID (including all its pages)
// @route   GET /api/notes/:id
// @access  Private
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });

    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    res.json(note);
  } catch (error) {
    console.error("Error in getNoteById:", error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid note ID.' });
    }
    res.status(500).json({ message: 'Server error while fetching note.' });
  }
};

// @desc    Add a new page to a note
// @route   POST /api/notes/:id/pages
// @access  Private
const addPage = async (req, res) => {
  const { title = 'Untitled Page', content = '' } = req.body;

  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });

    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    const newPage = {
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    note.pages.push(newPage);
    note.updatedAt = Date.now();
    const updatedNote = await note.save();

    // Return the newly added page and its temporary ID (index) or the full note
    // Returning the page itself is useful
    const addedPage = updatedNote.pages[updatedNote.pages.length - 1];
    res.status(201).json({ page: addedPage, message: 'Page added successfully.' });
  } catch (error) {
    console.error("Error in addPage:", error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid note ID.' });
    }
    res.status(500).json({ message: 'Server error while adding page.' });
  }
};

// @desc    Update a specific page within a note
// @route   PUT /api/notes/:id/pages/:pageId
// @access  Private
const updatePage = async (req, res) => {
  const { title, content } = req.body;
  const { id: noteId, pageId } = req.params; // pageId is the _id of the page subdocument

  try {
    const note = await Note.findOne({ _id: noteId, userId: req.user._id });

    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    const page = note.pages.id(pageId); // Mongoose method to find subdoc by _id
    if (!page) {
      return res.status(404).json({ message: 'Page not found within note.' });
    }

    if (title !== undefined) page.title = title;
    if (content !== undefined) page.content = content;
    page.updatedAt = Date.now();

    note.updatedAt = Date.now();
    await note.save();

    res.json({ page, message: 'Page updated successfully.' });
  } catch (error) {
    console.error("Error in updatePage:", error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid note or page ID.' });
    }
    res.status(500).json({ message: 'Server error while updating page.' });
  }
};

// @desc    Delete a specific page from a note
// @route   DELETE /api/notes/:id/pages/:pageId
// @access  Private
const deletePage = async (req, res) => {
  const { id: noteId, pageId } = req.params;

  try {
    const note = await Note.findOne({ _id: noteId, userId: req.user._id });

    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    const page = note.pages.id(pageId);
    if (!page) {
      return res.status(404).json({ message: 'Page not found within note.' });
    }

    // Prevent deletion if it's the last page
    if (note.pages.length <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last page. A note must have at least one page.' });
    }

    page.remove(); // Mongoose method to remove subdocument
    note.updatedAt = Date.now();
    await note.save();

    res.json({ message: 'Page deleted successfully.' });
  } catch (error) {
    console.error("Error in deletePage:", error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid note or page ID.' });
    }
    res.status(500).json({ message: 'Server error while deleting page.' });
  }
};

// --- Removed functions ---
// getNotes, updateNote, deleteNote (for the whole note entity) are removed or not needed
// as we are focusing on page-level operations and note-by-window lookup.
// You can add them back if needed for other features (like deleting an entire note window).

module.exports = {
  getNotesByWindow,
  createNote,
  getNoteById,
  addPage,
  updatePage,
  deletePage
};
