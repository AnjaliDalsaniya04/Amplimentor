'use strict';
const express = require('express');
const { requireAuthApi, requireRoleApi } = require('../middleware/auth');
const mentorController = require('../controllers/mentorController');
const router = express.Router();

router.get('/', requireAuthApi, mentorController.listMentors);
router.get('/requests/list', requireRoleApi('mentor'), mentorController.listMentorRequests);
router.get('/students/list', requireRoleApi('mentor'), mentorController.listMentorStudents);
router.put('/requests/:id', requireRoleApi('mentor'), mentorController.updateRequestStatus);
router.get('/:id', requireAuthApi, mentorController.getMentor);
router.post('/request', requireRoleApi('student'), mentorController.createMentorRequest);
router.get('/student/requests', requireRoleApi('student'), mentorController.listStudentRequests);
router.get('/student/accepted', requireRoleApi('student'), mentorController.listStudentAcceptedMentors);
router.put('/pricing', requireRoleApi('mentor'), mentorController.updatePricing);

module.exports = router;
