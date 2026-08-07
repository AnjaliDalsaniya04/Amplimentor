'use strict';
const express = require('express');
const { requireAuthApi } = require('../middleware/auth');
const { upload } = require('../utils/upload');
const chatController = require('../controllers/chatController');
const router = express.Router();

router.get('/', requireAuthApi, chatController.listChats);
router.post('/', requireAuthApi, chatController.getOrCreateChat);
router.get('/:chatId/messages', requireAuthApi, chatController.listMessages);
router.post('/:chatId/messages', requireAuthApi, upload.single('attachment'), chatController.sendMessage);

module.exports = router;
