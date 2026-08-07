'use strict';
const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    const token = authService.generateToken(user);
    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const user = await authService.login(req.body);
    const token = authService.generateToken(user);
    res.json({
      message: 'Login successful!',
      token,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  res.json({ message: 'Logged out. To complete logout, discard the token on the client.' });
}

module.exports = { register, login, logout };