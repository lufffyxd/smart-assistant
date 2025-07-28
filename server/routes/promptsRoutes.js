const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  getPrompts, 
  createPrompt, 
  updatePrompt, 
  deletePrompt 
} = require('../controllers/promptsController');

const router = express.Router();

router.route('/')
  .get(protect, getPrompts)
  .post(protect, createPrompt);

router.route('/:id')
  .put(protect, updatePrompt)
  .delete(protect, deletePrompt);

module.exports = router;