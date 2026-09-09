'use strict';
const { Op } = require('sequelize');
const { User, MentorRequest, Notification } = require('../models');

const mentorPublicFields = [
  'id','name','email','role','photo','bio','company','experience','location',
  'expertiseAreas','technicalSkills','industry','mentoringStyle','availability',
  'maxStudents','education','certifications','hourlyRate','sessionRate','subscriptionPlans',
  'subjects','standard',
];

async function listMentors() {
  return User.findAll({
    where: { role: 'mentor' },
    attributes: mentorPublicFields,
    order: [['name', 'ASC']],
  });
}

async function getMentorById(id) {
  return User.findOne({ where: { id, role: 'mentor' }, attributes: mentorPublicFields });
}

async function listMentorRequests(mentorId) {
  return MentorRequest.findAll({
    where: { mentorId },
    include: [
      { model: User, as: 'student', attributes: ['id','name','email','photo','standard','subjects'] },
      { model: User, as: 'mentor',  attributes: ['id','name','email','photo'] },
    ],
    order: [['createdAt', 'DESC']],
  });
}

async function listMentorStudents(mentorId) {
  const requests = await MentorRequest.findAll({
    where: { mentorId, status: 'accepted' },
    include: [{ model: User, as: 'student', attributes: ['id','name','email','photo','standard','subjects'] }],
  });
  return requests.map((r) => r.student);
}

async function updateRequestStatus(requestId, mentorId, status) {
  if (!['accepted', 'rejected', 'removed'].includes(status))
    throw Object.assign(new Error('Invalid status.'), { status: 400 });

  const request = await MentorRequest.findByPk(requestId);
  if (!request) throw Object.assign(new Error('Request not found.'), { status: 404 });
  if (request.mentorId !== mentorId) throw Object.assign(new Error('Access denied.'), { status: 403 });

  await request.update({ status });
  const message = status === 'accepted'
    ? 'Your mentoring request was accepted!'
    : `Your mentoring request was ${status}.`;

  await Notification.create({
    userId: request.studentId,
    type: 'mentor_request',
    message,
    link: '/student-dashboard.html',
  });

  return MentorRequest.findByPk(request.id, {
    include: [
      { model: User, as: 'student', attributes: ['id','name','email','photo','standard','subjects'] },
      { model: User, as: 'mentor',  attributes: ['id','name','email','photo','company','experience'] },
    ],
  });
}

async function createMentorRequest(studentId, mentorId, message) {
  if (!mentorId || !message)
    throw Object.assign(new Error('mentorId and message are required.'), { status: 400 });

  const mentor = await User.findOne({ where: { id: mentorId, role: 'mentor' } });
  if (!mentor) throw Object.assign(new Error('Mentor not found.'), { status: 404 });

  const existing = await MentorRequest.findOne({
    where: { studentId, mentorId, status: { [Op.in]: ['pending', 'accepted'] } },
  });
  if (existing) throw Object.assign(new Error('Request already exists.'), { status: 409 });

  const request = await MentorRequest.create({ studentId, mentorId, message });
  await Notification.create({
    userId: mentorId,
    type: 'mentor_request',
    message: 'New mentoring request from a student.',
    link: '/mentor-dashboard.html',
  });

  return MentorRequest.findByPk(request.id, {
    include: [
      { model: User, as: 'student', attributes: ['id','name','email','photo','standard','subjects'] },
      { model: User, as: 'mentor',  attributes: ['id','name','email','photo','company','experience'] },
    ],
  });
}

async function listStudentRequests(studentId) {
  return MentorRequest.findAll({
    where: { studentId },
    include: [
      { model: User, as: 'mentor', attributes: ['id','name','email','photo','company','experience','standard','subjects'] },
      { model: User, as: 'student', attributes: ['id','name','email','photo'] },
    ],
    order: [['createdAt', 'DESC']],
  });
}

async function listStudentAcceptedMentors(studentId) {
  const requests = await MentorRequest.findAll({
    where: { studentId, status: 'accepted' },
    include: [{ model: User, as: 'mentor', attributes: ['id','name','email','photo','company','experience'] }],
  });
  return requests.map((r) => r.mentor);
}

async function updatePricing(mentorId, pricing) {
  const data = {};
  if (pricing.hourlyRate !== undefined) data.hourlyRate = pricing.hourlyRate;
  if (pricing.sessionRate !== undefined) data.sessionRate = pricing.sessionRate;
  if (pricing.subscriptionPlans !== undefined) data.subscriptionPlans = pricing.subscriptionPlans;
  await User.update(data, { where: { id: mentorId } });
  return { message: 'Pricing updated.' };
}

module.exports = {
  listMentors,
  getMentorById,
  listMentorRequests,
  listMentorStudents,
  updateRequestStatus,
  createMentorRequest,
  listStudentRequests,
  listStudentAcceptedMentors,
  updatePricing,
};