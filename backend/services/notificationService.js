'use strict';
const { Notification } = require('../models');

async function listNotifications(userId) {
  return Notification.findAll({
    where: { userId, isRead: false },
    order: [['createdAt', 'DESC']],
    limit: 20,
  });
}

async function markRead(userId, notificationId) {
  const count = await Notification.update(
    { isRead: true },
    { where: { id: notificationId, userId } }
  );
  if (count[0] === 0)
    throw Object.assign(new Error('Notification not found.'), { status: 404 });
  return { message: 'Notification marked as read.' };
}

async function markAllRead(userId) {
  await Notification.update(
    { isRead: true },
    { where: { userId, isRead: false } }
  );
  return { message: 'All notifications marked as read.' };
}

module.exports = { listNotifications, markRead, markAllRead };