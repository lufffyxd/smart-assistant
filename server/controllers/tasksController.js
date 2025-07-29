// server/controllers/tasksController.js
const Task = require('../models/Task');

// @desc    Get all tasks for a user
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    // Optional: Add query parameters for filtering (e.g., ?completed=true)
    const filter = { userId: req.user._id };
    if (req.query.completed !== undefined) {
        filter.completed = req.query.completed === 'true';
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error("Error in getTasks:", error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  const { title, description, dueDate } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    const task = new Task({
      userId: req.user._id,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined // Handle date parsing
    });

    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    console.error("Error in createTask:", error);
    res.status(500).json({ message: 'Server error while creating task' });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  const { title, description, completed, dueDate } = req.body;

  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.title = title || task.title;
    task.description = description || task.description;
    // Only update completed/dueDate if provided in the request
    if (completed !== undefined) task.completed = completed;
    if (dueDate !== undefined) task.dueDate = new Date(dueDate);

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    console.error("Error in updateTask:", error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid task ID' });
    }
    res.status(500).json({ message: 'Server error while updating task' });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.deleteOne({ _id: req.params.id });
    res.json({ message: 'Task removed' });
  } catch (error) {
    console.error("Error in deleteTask:", error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid task ID' });
    }
    res.status(500).json({ message: 'Server error while deleting task' });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask
};