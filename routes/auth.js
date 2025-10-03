const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTP, verifyOTP } = require('../utils/twilio');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// Password-based registration (advertiser) - sends OTP for verification
router.post('/register', validateRequest(schemas.register), async (req, res) => {
  try {
    const { role, name, phone, password } = req.body;

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(400).json({ ok: false, error: 'User already exists' });
    }

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await User.create({ phone, name, passwordHash, role: role || 'advertiser', isVerified: false });
    
    // Send OTP for registration verification
    const result = await sendOTP(phone);
    
    return res.status(201).json({ ok: true, message: 'OTP sent for verification', data: result });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ ok: false, error: 'Failed to register' });
  }
});

// Verify registration OTP to activate account
router.post('/register/verify', validateRequest(schemas.verifyRegistration), async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    // Verify OTP using Twilio Verify
    const { valid } = await verifyOTP(phone, otp);
    if (!valid) {
      return res.status(401).json({ ok: false, error: 'Invalid code' });
    }

    user.isVerified = true;
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ ok: true, message: 'Registration verified', token, user: { id: user._id, role: user.role, phone: user.phone, name: user.name } });
  } catch (error) {
    console.error('Register verify error:', error);
    return res.status(500).json({ ok: false, error: 'Failed to verify registration' });
  }
});

// Password-based login (advertiser)
router.post('/login', validateRequest(schemas.login), async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user  || !user.passwordHash) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ ok: false, error: 'Account not verified. Please complete OTP verification.' });
    }

    const bcrypt = require('bcryptjs');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ ok: true, token, user: { id: user._id, role: user.role, phone: user.phone, name: user.name } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ ok: false, error: 'Failed to login' });
  }
});

// (Removed legacy /otp/send and /otp/verify endpoints)

module.exports = router;
