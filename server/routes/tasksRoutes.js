// server/routes/tasksRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask 
} = require('../controllers/tasksController');

const router = express.Router();

// All routes protected by authentication
router.route('/')
  .get(protect, getTasks)      // GET /api/tasks
  .post(protect, createTask);  // POST /api/tasks

router.route('/:id')
  .put(protect, updateTask)    // PUT /api/tasks/:id
  .delete(protect, deleteTask); // DELETE /api/tasks/:id

module.exports = router;