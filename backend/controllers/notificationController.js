'use strict';
const notificationService = require('../services/notificationService');

async function listNotifications(req, res, next) {
  try {
    const notifications = await notificationService.listNotifications(req.currentUser.id);
    res.json({ count: notifications.length, notifications });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const result = await notificationService.markRead(req.currentUser.id, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    const result = await notificationService.markAllRead(req.currentUser.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, markRead, markAllRead };