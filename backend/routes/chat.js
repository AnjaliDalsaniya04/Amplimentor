'use strict';
const express = require('express');
const path    = require('path');
const multer  = require('multer');
const { Op }  = require('sequelize');
const { User, Chat, Message, Notification } = require('../models');
const { requireAuthApi } = require('../middleware/auth');
const router  = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../frontend/public/uploads/')),
  filename:    (req, file, cb) => cb(null, `${req.session.userId}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// GET /api/chats  — list all conversations
router.get('/', requireAuthApi, async (req, res) => {
  try {
    const user  = await User.findByPk(req.session.userId);
    const where = user.role === 'student' ? { studentId: req.session.userId } : { mentorId: req.session.userId };
    const chats = await Chat.findAll({
      where,
      include: [
        { model: User,    as: 'mentor',   attributes: ['id','name','photo'] },
        { model: User,    as: 'student',  attributes: ['id','name','photo'] },
        { model: Message, as: 'messages', attributes: ['id','content','senderId','createdAt','attachment'],
          limit: 1, order: [['createdAt','DESC']] },
      ],
      order: [['lastMessageAt', 'DESC']],
    });
    res.json(chats);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/chats  — create or get chat between two users
router.post('/', requireAuthApi, async (req, res) => {
  try {
    const user    = await User.findByPk(req.session.userId);
    const otherId = req.body.mentorId || req.body.studentId;
    if (!otherId) return res.status(400).json({ message: 'Other participant ID required.' });
    let mentorId, studentId;
    if (user.role === 'student') { studentId = user.id; mentorId = otherId; }
    else                         { mentorId  = user.id; studentId = otherId; }
    const [chat] = await Chat.findOrCreate({ where: { mentorId, studentId }, defaults: { mentorId, studentId } });
    res.json(chat);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/chats/:chatId/messages
router.get('/:chatId/messages', requireAuthApi, async (req, res) => {
  try {
    const chat = await Chat.findByPk(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });
    if (chat.mentorId !== req.session.userId && chat.studentId !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    const since = req.query.since;
    const where = since
      ? { chatId: req.params.chatId, createdAt: { [Op.gt]: new Date(since) } }
      : { chatId: req.params.chatId };
    const messages = await Message.findAll({
      where,
      include: [{ model: User, as: 'sender', attributes: ['id','name','photo'] }],
      order: [['createdAt', 'ASC']],
    });
    res.json(messages);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/chats/:chatId/messages  — send a message
router.post('/:chatId/messages', requireAuthApi, upload.single('attachment'), async (req, res) => {
  try {
    const chat = await Chat.findByPk(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });
    if (chat.mentorId !== req.session.userId && chat.studentId !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    const { content } = req.body;
    if (!content && !req.file)
      return res.status(400).json({ message: 'Message or attachment required.' });
    const msg = await Message.create({
      chatId:     req.params.chatId,
      senderId:   req.session.userId,
      content:    content || '',
      attachment: req.file ? req.file.filename : null,
    });
    await chat.update({ lastMessage: content || 'Attachment', lastMessageAt: new Date() });
    const recipientId = chat.mentorId === req.session.userId ? chat.studentId : chat.mentorId;
    await Notification.create({ userId: recipientId, type: 'chat', message: 'You have a new message.', link: '/chat.html' });
    const populated = await Message.findByPk(msg.id, {
      include: [{ model: User, as: 'sender', attributes: ['id','name','photo'] }],
    });
    res.status(201).json(populated);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;
