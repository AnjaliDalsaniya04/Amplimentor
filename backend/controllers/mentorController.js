'use strict';
const mentorService = require('../services/mentorService');

async function listMentors(req, res, next) {
  try {
    const mentors = await mentorService.listMentors();
    res.json(mentors);
  } catch (err) {
    next(err);
  }
}

async function getMentor(req, res, next) {
  try {
    const mentor = await mentorService.getMentorById(req.params.id);
    if (!mentor) return res.status(404).json({ message: 'Mentor not found.' });
    res.json(mentor);
  } catch (err) {
    next(err);
  }
}

async function listMentorRequests(req, res, next) {
  try {
    const requests = await mentorService.listMentorRequests(req.currentUser.id);
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

async function listMentorStudents(req, res, next) {
  try {
    const students = await mentorService.listMentorStudents(req.currentUser.id);
    res.json(students);
  } catch (err) {
    next(err);
  }
}

async function updateRequestStatus(req, res, next) {
  try {
    const request = await mentorService.updateRequestStatus(req.params.id, req.currentUser.id, req.body.status);
    res.json(request);
  } catch (err) {
    next(err);
  }
}

async function createMentorRequest(req, res, next) {
  try {
    const request = await mentorService.createMentorRequest(req.currentUser.id, req.body.mentorId, req.body.message);
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
}

async function listStudentRequests(req, res, next) {
  try {
    const requests = await mentorService.listStudentRequests(req.currentUser.id);
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

async function listStudentAcceptedMentors(req, res, next) {
  try {
    const mentors = await mentorService.listStudentAcceptedMentors(req.currentUser.id);
    res.json(mentors);
  } catch (err) {
    next(err);
  }
}

async function updatePricing(req, res, next) {
  try {
    const result = await mentorService.updatePricing(req.currentUser.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMentors,
  getMentor,
  listMentorRequests,
  listMentorStudents,
  updateRequestStatus,
  createMentorRequest,
  listStudentRequests,
  listStudentAcceptedMentors,
  updatePricing,
};