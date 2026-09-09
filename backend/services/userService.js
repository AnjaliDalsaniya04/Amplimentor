'use strict';
const { User } = require('../models');

const userPublicFields = [
  'id','name','email','role','photo','bio','phoneNumber','address','dateOfBirth',
  'linkedIn','github','portfolio','studentId','standard','university','subjects',
  'gpa','careerGoals','skillsToDevelop','areasOfInterest','meetingFrequency',
  'communicationPreference','company','experience','location','expertiseAreas',
  'technicalSkills','industry','mentoringStyle','availability','maxStudents',
  'education','certifications','hourlyRate','sessionRate','subscriptionPlans',
];

async function getProfile(userId) {
  return User.findByPk(userId, { attributes: userPublicFields });
}

async function updateStudentProfile(userId, updates) {
  const allowed = ['name','bio','phoneNumber','address','dateOfBirth','linkedIn','github',
    'studentId','standard','university','subjects','gpa','careerGoals','skillsToDevelop',
    'areasOfInterest','meetingFrequency','communicationPreference'];
  const data = {};
  allowed.forEach((key) => { if (updates[key] !== undefined) data[key] = updates[key]; });
  await User.update(data, { where: { id: userId } });
  return getProfile(userId);
}

async function updateMentorProfile(userId, updates) {
  const allowed = ['name','bio','phoneNumber','address','linkedIn','github','portfolio',
    'company','experience','location','expertiseAreas','technicalSkills','industry',
    'mentoringStyle','availability','maxStudents','education','certifications',
    'meetingFrequency','communicationPreference'];
  const data = {};
  allowed.forEach((key) => { if (updates[key] !== undefined) data[key] = updates[key]; });
  await User.update(data, { where: { id: userId } });
  return getProfile(userId);
}

async function uploadPhoto(userId, filename) {
  await User.update({ photo: filename }, { where: { id: userId } });
  return { success: true, filename };
}

module.exports = { getProfile, updateStudentProfile, updateMentorProfile, uploadPhoto };