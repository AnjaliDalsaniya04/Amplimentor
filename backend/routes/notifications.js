'use strict';
const express = require('express');
const { Notification } = require('../models');
const { requireAuthApi } = require('../middleware/auth');
const router = express.Router();

// GET /api/notifications  — get unread notifications
router.get('/', requireAuthApi, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.session.userId, isRead: false },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    res.json({ count: notifications.length, notifications });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/notifications/:id/read  — mark one as read
router.put('/:id/read', requireAuthApi, async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { id: req.params.id, userId: req.session.userId } }
    );
    res.json({ message: 'Notification marked as read.' });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/notifications/read-all  — mark all as read
router.put('/read-all', requireAuthApi, async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.session.userId, isRead: false } }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;
