'use strict';
const express = require('express');
const path    = require('path');
const multer  = require('multer');
const { User } = require('../models');
const { requireAuthApi, requireRoleApi } = require('../middleware/auth');
const router  = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../frontend/public/uploads/')),
  filename:    (req, file, cb) => cb(null, `${req.session.userId}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

const userPublicFields = [
  'id','name','email','role','photo','bio','phoneNumber','address','dateOfBirth',
  'linkedIn','github','portfolio','studentId','standard','university','subjects',
  'gpa','careerGoals','skillsToDevelop','areasOfInterest','meetingFrequency',
  'communicationPreference','company','experience','location','expertiseAreas',
  'technicalSkills','industry','mentoringStyle','availability','maxStudents',
  'education','certifications','hourlyRate','sessionRate','subscriptionPlans',
];

// GET /api/profile  (any logged-in user)
router.get('/profile', requireAuthApi, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId, { attributes: userPublicFields });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/student/profile
router.get('/student/profile', requireRoleApi('student'), async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId, { attributes: userPublicFields });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/mentor/profile
router.get('/mentor/profile', requireRoleApi('mentor'), async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId, { attributes: userPublicFields });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/student/profile
router.put('/student/profile', requireRoleApi('student'), async (req, res) => {
  const allowed = ['name','bio','phoneNumber','address','dateOfBirth','linkedIn','github',
    'studentId','standard','university','subjects','gpa','careerGoals','skillsToDevelop',
    'areasOfInterest','meetingFrequency','communicationPreference'];
  try {
    const data = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
    await User.update(data, { where: { id: req.session.userId } });
    const user = await User.findByPk(req.session.userId, { attributes: userPublicFields });
    res.json(user);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/mentor/profile
router.put('/mentor/profile', requireRoleApi('mentor'), async (req, res) => {
  const allowed = ['name','bio','phoneNumber','address','linkedIn','github','portfolio',
    'company','experience','location','expertiseAreas','technicalSkills','industry',
    'mentoringStyle','availability','maxStudents','education','certifications',
    'meetingFrequency','communicationPreference'];
  try {
    const data = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
    await User.update(data, { where: { id: req.session.userId } });
    const user = await User.findByPk(req.session.userId, { attributes: userPublicFields });
    res.json(user);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/student/upload-photo
router.post('/student/upload-photo', requireRoleApi('student'), upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  try {
    await User.update({ photo: req.file.filename }, { where: { id: req.session.userId } });
    res.json({ success: true, filename: req.file.filename });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/mentor/upload-photo
router.post('/mentor/upload-photo', requireRoleApi('mentor'), upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  try {
    await User.update({ photo: req.file.filename }, { where: { id: req.session.userId } });
    res.json({ success: true, filename: req.file.filename });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;
