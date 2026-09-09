'use strict';
const sessionService = require('../services/sessionService');

async function listSessions(req, res, next) {
  try {
    const sessions = await sessionService.listSessions(req.currentUser.id);
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

async function createSession(req, res, next) {
  try {
    const session = await sessionService.createSession(req.currentUser.id, req.body);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

async function updateSession(req, res, next) {
  try {
    const session = await sessionService.updateSession(req.currentUser.id, req.params.id, req.body);
    res.json(session);
  } catch (err) {
    next(err);
  }
}

async function deleteSession(req, res, next) {
  try {
    const result = await sessionService.deleteSession(req.currentUser.id, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function listHistory(req, res, next) {
  try {
    const history = await sessionService.listHistory(req.currentUser.id);
    res.json(history);
  } catch (err) {
    next(err);
  }
}

async function getHistoryStats(req, res, next) {
  try {
    const stats = await sessionService.getHistoryStats(req.currentUser.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

async function endHistory(req, res, next) {
  try {
    const history = await sessionService.endHistory(req.currentUser.id, req.params.id, req.body);
    res.json(history);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listSessions,
  createSession,
  updateSession,
  deleteSession,
  listHistory,
  getHistoryStats,
  endHistory,
};