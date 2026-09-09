'use strict';
const express = require('express');
const { requireAuthApi } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');
const router = express.Router();

router.get('/', requireAuthApi, notificationController.listNotifications);
router.put('/:id/read', requireAuthApi, notificationController.markRead);
router.put('/read-all', requireAuthApi, notificationController.markAllRead);

module.exports = router;
