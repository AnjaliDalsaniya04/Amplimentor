'use strict';
const express = require('express');
const bcrypt  = require('bcrypt');
const { User } = require('../models');
const router  = express.Router();

// POST /register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ message: 'All fields are required.' });
  if (!['student', 'mentor'].includes(role))
    return res.status(400).json({ message: 'Role must be student or mentor.' });
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ name, email, password: hashed, role });
    req.session.userId = user.id;
    res.status(201).json({ message: 'Registration successful!', user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match)  return res.status(401).json({ message: 'Invalid email or password.' });
    req.session.userId = user.id;
    res.json({ message: 'Login successful!', user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out.' });
});

// POST /logout  (fetch call from frontend)
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out.' });
});

module.exports = router;
