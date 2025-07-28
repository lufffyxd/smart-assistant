const CustomPrompt = require('../models/CustomPrompt');

const getPrompts = async (req, res) => {
  try {
    const prompts = await CustomPrompt.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPrompt = async (req, res) => {
  try {
    const prompt = await CustomPrompt.create({
      userId: req.user._id,
      title: req.body.title,
      prompt: req.body.prompt
    });
    res.status(201).json(prompt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePrompt = async (req, res) => {
  try {
    const prompt = await CustomPrompt.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title: req.body.title, prompt: req.body.prompt },
      { new: true }
    );
    
    if (!prompt) {
      return res.status(404).json({ message: 'Prompt not found' });
    }
    
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePrompt = async (req, res) => {
  try {
    const prompt = await CustomPrompt.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!prompt) {
      return res.status(404).json({ message: 'Prompt not found' });
    }
    
    res.json({ message: 'Prompt removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt
};