const express = require('express');
const router = express.Router();
const SetupConfig = require('../models/SetupConfig');
const { protect, authorize } = require('../middleware/auth');

const VALID_CATEGORIES = ['roles', 'entity_types', 'currencies', 'wealth_sources', 'service_types'];

// GET all items for a category — any authenticated user (suppliers need this for form dropdowns)
router.get('/:category', protect, async (req, res) => {
  try {
    const { category } = req.params;
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }
    const items = await SetupConfig.find({ category }).sort({ createdAt: 1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch setup items' });
  }
});

// POST create item
router.post('/', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { category, name, description } = req.body;
    if (!category || !name?.trim()) {
      return res.status(400).json({ success: false, message: 'Category and name are required' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }
    const item = await SetupConfig.create({ category, name: name.trim(), description: description?.trim() || '' });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'An item with this name already exists in this category' });
    }
    res.status(500).json({ success: false, message: 'Failed to create setup item' });
  }
});

// PUT update item
router.put('/:id', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const item = await SetupConfig.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), description: description?.trim() || '' },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'An item with this name already exists in this category' });
    }
    res.status(500).json({ success: false, message: 'Failed to update setup item' });
  }
});

// DELETE item
router.delete('/:id', protect, authorize('super_admin'), async (req, res) => {
  try {
    const item = await SetupConfig.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete setup item' });
  }
});

module.exports = router;
