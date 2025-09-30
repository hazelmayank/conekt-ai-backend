const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireAdvertiser } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/', authenticateToken, requireAdvertiser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-otp');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/', authenticateToken, requireAdvertiser, async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Check if phone is already taken by another user
    if (phone && phone !== req.user.phone) {
      const existingUser = await User.findOne({ phone, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Phone number already in use' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { phone },
      { new: true, runValidators: true }
    ).select('-otp');

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
