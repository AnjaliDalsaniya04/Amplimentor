'use strict';
const express = require('express');
const { requireAuthApi, requireRoleApi } = require('../middleware/auth');
const { upload } = require('../utils/upload');
const userController = require('../controllers/userController');
const router = express.Router();

router.get('/profile', requireAuthApi, userController.getProfile);
router.get('/student/profile', requireRoleApi('student'), userController.getStudentProfile);
router.get('/mentor/profile', requireRoleApi('mentor'), userController.getMentorProfile);
router.put('/student/profile', requireRoleApi('student'), userController.updateStudentProfile);
router.put('/mentor/profile', requireRoleApi('mentor'), userController.updateMentorProfile);
router.post('/student/upload-photo', requireRoleApi('student'), upload.single('photo'), userController.uploadPhoto);
router.post('/mentor/upload-photo', requireRoleApi('mentor'), upload.single('photo'), userController.uploadPhoto);

module.exports = router;
