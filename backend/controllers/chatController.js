'use strict';
const chatService = require('../services/chatService');

async function listChats(req, res, next) {
  try {
    const chats = await chatService.listChats(req.currentUser.id);
    res.json(chats);
  } catch (err) {
    next(err);
  }
}

async function getOrCreateChat(req, res, next) {
  try {
    const chat = await chatService.getOrCreateChat(req.currentUser.id, req.body);
    res.json(chat);
  } catch (err) {
    next(err);
  }
}

async function listMessages(req, res, next) {
  try {
    const messages = await chatService.listMessages(req.currentUser.id, req.params.chatId, req.query.since);
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const message = await chatService.sendMessage(req.currentUser.id, req.params.chatId, req.body, req.file);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

module.exports = { listChats, getOrCreateChat, listMessages, sendMessage };