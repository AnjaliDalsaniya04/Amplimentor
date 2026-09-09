'use strict';
const userService = require('../services/userService');

async function getProfile(req, res, next) {
  try {
    const user = await userService.getProfile(req.currentUser.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function getStudentProfile(req, res, next) {
  try {
    const user = await userService.getProfile(req.currentUser.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function getMentorProfile(req, res, next) {
  try {
    const user = await userService.getProfile(req.currentUser.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function updateStudentProfile(req, res, next) {
  try {
    const user = await userService.updateStudentProfile(req.currentUser.id, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function updateMentorProfile(req, res, next) {
  try {
    const user = await userService.updateMentorProfile(req.currentUser.id, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const result = await userService.uploadPhoto(req.currentUser.id, req.file.filename);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  getStudentProfile,
  getMentorProfile,
  updateStudentProfile,
  updateMentorProfile,
  uploadPhoto,
};