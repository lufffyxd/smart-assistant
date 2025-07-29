// server/controllers/notesController.js
const Note = require('../models/Note');

// @desc    Get all notes for a user
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user._id })
      .sort({ createdAt: -1 }); // Newest first
    res.json(notes);
  } catch (error) {
    console.error("Error in getNotes:", error);
    res.status(500).json({ message: 'Server error while fetching notes' });
  }
};

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const note = new Note({
      userId: req.user._id,
      title,
      content
    });

    const createdNote = await note.save();
    res.status(201).json(createdNote);
  } catch (error) {
    console.error("Error in createNote:", error);
    res.status(500).json({ message: 'Server error while creating note' });
  }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res) => {
  const { title, content } = req.body;

  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.title = title || note.title;
    note.content = content || note.content;

    const updatedNote = await note.save();
    res.json(updatedNote);
  } catch (error) {
    console.error("Error in updateNote:", error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid note ID' });
    }
    res.status(500).json({ message: 'Server error while updating note' });
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    await Note.deleteOne({ _id: req.params.id }); // Use deleteOne for Mongoose 7+
    res.json({ message: 'Note removed' });
  } catch (error) {
    console.error("Error in deleteNote:", error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid note ID' });
    }
    res.status(500).json({ message: 'Server error while deleting note' });
  }
};

module.exports = {
  getNotes,
  createNote,
  updateNote,
  deleteNote
};