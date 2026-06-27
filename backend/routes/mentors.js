'use strict';
const express = require('express');
const { Op }  = require('sequelize');
const { User, MentorRequest, Notification } = require('../models');
const { requireAuthApi, requireRoleApi } = require('../middleware/auth');
const router  = express.Router();

const mentorPublicFields = [
  'id','name','email','role','photo','bio','company','experience','location',
  'expertiseAreas','technicalSkills','industry','mentoringStyle','availability',
  'maxStudents','education','certifications','hourlyRate','sessionRate',
  'subscriptionPlans','subjects','standard',
];

// GET /api/mentors  — browse all mentors
router.get('/', requireAuthApi, async (req, res) => {
  try {
    const mentors = await User.findAll({
      where: { role: 'mentor' },
      attributes: mentorPublicFields,
      order: [['name', 'ASC']],
    });
    res.json(mentors);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/mentors/:id
router.get('/:id', requireAuthApi, async (req, res) => {
  try {
    const mentor = await User.findOne({ where: { id: req.params.id, role: 'mentor' }, attributes: mentorPublicFields });
    if (!mentor) return res.status(404).json({ message: 'Mentor not found.' });
    res.json(mentor);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/mentors/requests/list  — mentor sees incoming requests
router.get('/requests/list', requireRoleApi('mentor'), async (req, res) => {
  try {
    const requests = await MentorRequest.findAll({
      where: { mentorId: req.session.userId },
      include: [
        { model: User, as: 'student', attributes: ['id','name','email','photo','standard','subjects'] },
        { model: User, as: 'mentor',  attributes: ['id','name','email','photo'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(requests);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/mentors/students/list  — mentor sees accepted students
router.get('/students/list', requireRoleApi('mentor'), async (req, res) => {
  try {
    const requests = await MentorRequest.findAll({
      where: { mentorId: req.session.userId, status: 'accepted' },
      include: [{ model: User, as: 'student', attributes: ['id','name','email','photo','standard','subjects'] }],
    });
    res.json(requests.map(r => r.student));
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/mentors/requests/:id  — mentor accepts/rejects
router.put('/requests/:id', requireRoleApi('mentor'), async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected', 'removed'].includes(status))
    return res.status(400).json({ message: 'Invalid status.' });
  try {
    const request = await MentorRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.mentorId !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    await request.update({ status });
    const msg = status === 'accepted'
      ? 'Your mentoring request was accepted!'
      : `Your mentoring request was ${status}.`;
    await Notification.create({ userId: request.studentId, type: 'mentor_request', message: msg, link: '/student-dashboard.html' });
    const populated = await MentorRequest.findByPk(request.id, {
      include: [
        { model: User, as: 'student', attributes: ['id','name','email','photo','standard','subjects'] },
        { model: User, as: 'mentor',  attributes: ['id','name','email','photo','company','experience'] },
      ],
    });
    res.json(populated);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

// ── STUDENT SIDE ─────────────────────────────────────────────

// POST /api/mentors/request  — student sends request to a mentor
router.post('/request', requireRoleApi('student'), async (req, res) => {
  const { mentorId, message } = req.body;
  if (!mentorId || !message)
    return res.status(400).json({ message: 'mentorId and message are required.' });
  try {
    const mentor = await User.findOne({ where: { id: mentorId, role: 'mentor' } });
    if (!mentor) return res.status(404).json({ message: 'Mentor not found.' });
    const existing = await MentorRequest.findOne({
      where: { studentId: req.session.userId, mentorId, status: { [Op.in]: ['pending', 'accepted'] } },
    });
    if (existing) return res.status(409).json({ message: 'Request already exists.' });
    const request = await MentorRequest.create({ studentId: req.session.userId, mentorId, message });
    await Notification.create({
      userId: mentorId, type: 'mentor_request',
      message: 'New mentoring request from a student.', link: '/mentor-dashboard.html',
    });
    const populated = await MentorRequest.findByPk(request.id, {
      include: [
        { model: User, as: 'student', attributes: ['id','name','email','photo','standard','subjects'] },
        { model: User, as: 'mentor',  attributes: ['id','name','email','photo','company','experience'] },
      ],
    });
    res.status(201).json(populated);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/mentors/student/requests  — student sees sent requests
router.get('/student/requests', requireRoleApi('student'), async (req, res) => {
  try {
    const requests = await MentorRequest.findAll({
      where: { studentId: req.session.userId },
      include: [
        { model: User, as: 'mentor',  attributes: ['id','name','email','photo','company','experience','standard','subjects'] },
        { model: User, as: 'student', attributes: ['id','name','email','photo'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(requests);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/mentors/student/accepted  — student sees accepted mentors
router.get('/student/accepted', requireRoleApi('student'), async (req, res) => {
  try {
    const requests = await MentorRequest.findAll({
      where: { studentId: req.session.userId, status: 'accepted' },
      include: [{ model: User, as: 'mentor', attributes: ['id','name','email','photo','company','experience'] }],
    });
    res.json(requests.map(r => r.mentor));
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/mentors/pricing  — mentor updates pricing
router.put('/pricing', requireRoleApi('mentor'), async (req, res) => {
  const { hourlyRate, sessionRate, subscriptionPlans } = req.body;
  try {
    await User.update({ hourlyRate, sessionRate, subscriptionPlans }, { where: { id: req.session.userId } });
    res.json({ message: 'Pricing updated.' });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;
