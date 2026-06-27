'use strict';
const { User } = require('../models');

// API guard — checks session, returns 401 if not logged in
function requireAuth(req, res, next) {
  if (!req.session.userId)
    return res.status(401).json({ message: 'Not authenticated.' });
  next();
}

// API guard — checks session + role, returns 401/403
function requireRole(role) {
  return async (req, res, next) => {
    if (!req.session.userId)
      return res.status(401).json({ message: 'Not authenticated.' });
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

// Aliases — same behaviour, clearer naming in route files
const requireAuthApi = requireAuth;
const requireRoleApi = requireRole;

module.exports = { requireAuth, requireRole, requireAuthApi, requireRoleApi };
