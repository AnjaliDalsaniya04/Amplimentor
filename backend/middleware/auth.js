'use strict';
const { User } = require('../models');

// Redirect-based guard (for page routes)
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

function requireRole(role) {
  return async (req, res, next) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
      const user = await User.findByPk(req.session.userId);
      if (!user || user.role !== role) return res.redirect('/login');
      next();
    } catch {
      return res.redirect('/login');
    }
  };
}

// JSON-based guard (for API routes)
function requireAuthApi(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ message: 'Not authenticated.' });
  next();
}

function requireRoleApi(role) {
  return async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ message: 'Not authenticated.' });
    try {
      const user = await User.findByPk(req.session.userId);
      if (!user || user.role !== role)
        return res.status(403).json({ message: `Access denied. ${role} role required.` });
      req.currentUser = user;
      next();
    } catch {
      return res.status(500).json({ message: 'Server error.' });
    }
  };
}

module.exports = { requireAuth, requireRole, requireAuthApi, requireRoleApi };
