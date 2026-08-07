'use strict';
const path = require('path');
const { Op } = require('sequelize');
const { User, Chat, Message, Notification } = require('../models');

function participantFields(role) {
  return { model: User, as: role, attributes: ['id','name','photo'] };
}

async function listChats(userId) {
  const user = await User.findByPk(userId);
  const where = user.role === 'student' ? { studentId: userId } : { mentorId: userId };
  return Chat.findAll({
    where,
    include: [
      { model: User,    as: 'mentor',   attributes: ['id','name','photo'] },
      { model: User,    as: 'student',  attributes: ['id','name','photo'] },
      { model: Message, as: 'messages', attributes: ['id','content','senderId','createdAt','attachment'], limit: 1, order: [['createdAt','DESC']] },
    ],
    order: [['lastMessageAt', 'DESC']],
  });
}

async function getOrCreateChat(userId, body) {
  const user = await User.findByPk(userId);
  const otherId = body.mentorId || body.studentId;
  if (!otherId) throw Object.assign(new Error('Other participant ID required.'), { status: 400 });

  let mentorId;
  let studentId;
  if (user.role === 'student') {
    studentId = user.id;
    mentorId = otherId;
  } else {
    mentorId = user.id;
    studentId = otherId;
  }

  const [chat] = await Chat.findOrCreate({ where: { mentorId, studentId }, defaults: { mentorId, studentId } });
  return chat;
}

async function listMessages(userId, chatId, since) {
  const chat = await Chat.findByPk(chatId);
  if (!chat) throw Object.assign(new Error('Chat not found.'), { status: 404 });
  if (chat.mentorId !== userId && chat.studentId !== userId)
    throw Object.assign(new Error('Access denied.'), { status: 403 });

  const where = { chatId };
  if (since) where.createdAt = { [Op.gt]: new Date(since) };

  return Message.findAll({
    where,
    include: [{ model: User, as: 'sender', attributes: ['id','name','photo'] }],
    order: [['createdAt', 'ASC']],
  });
}

async function sendMessage(userId, chatId, body, file) {
  const chat = await Chat.findByPk(chatId);
  if (!chat) throw Object.assign(new Error('Chat not found.'), { status: 404 });
  if (chat.mentorId !== userId && chat.studentId !== userId)
    throw Object.assign(new Error('Access denied.'), { status: 403 });

  const content = body.content || '';
  if (!content && !file) throw Object.assign(new Error('Message or attachment required.'), { status: 400 });

  const msg = await Message.create({
    chatId,
    senderId: userId,
    content,
    attachment: file ? file.filename : null,
  });

  await chat.update({ lastMessage: content || 'Attachment', lastMessageAt: new Date() });
  const recipientId = chat.mentorId === userId ? chat.studentId : chat.mentorId;
  await Notification.create({ userId: recipientId, type: 'chat', message: 'You have a new message.', link: '/chat.html' });

  return Message.findByPk(msg.id, { include: [{ model: User, as: 'sender', attributes: ['id','name','photo'] }] });
}

module.exports = { listChats, getOrCreateChat, listMessages, sendMessage };