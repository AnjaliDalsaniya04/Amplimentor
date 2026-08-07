'use strict';
const { User, Session, MentoringHistory } = require('../models');

function participantFields(role) {
  return { model: User, as: role, attributes: ['id','name','email','photo'] };
}

async function listSessions(userId) {
  const user = await User.findByPk(userId);
  const where = user.role === 'student' ? { studentId: userId } : { mentorId: userId };
  return Session.findAll({ where, include: [participantFields('mentor'), participantFields('student')], order: [['date', 'ASC']] });
}

async function createSession(userId, body) {
  const { topic, date, notes, mentor: mentorId, student: studentId } = body;
  if (!topic || !date)
    throw Object.assign(new Error('Topic and date are required.'), { status: 400 });

  const user = await User.findByPk(userId);
  const data = {
    topic,
    date: new Date(date),
    notes: notes || '',
    status: 'scheduled',
    mentorId: user.role === 'student' ? mentorId : userId,
    studentId: user.role === 'student' ? userId : studentId,
  };

  if (!data.mentorId || !data.studentId)
    throw Object.assign(new Error('Both mentor and student are required.'), { status: 400 });

  const sess = await Session.create(data);
  await MentoringHistory.findOrCreate({
    where: { mentorId: data.mentorId, studentId: data.studentId, status: 'active' },
    defaults: { mentorId: data.mentorId, studentId: data.studentId, startDate: new Date() },
  }).then(([history]) => history.increment('totalSessions'));

  return Session.findByPk(sess.id, { include: [participantFields('mentor'), participantFields('student')] });
}

async function updateSession(userId, sessionId, updates) {
  const sess = await Session.findByPk(sessionId);
  if (!sess) throw Object.assign(new Error('Session not found.'), { status: 404 });

  const user = await User.findByPk(userId);
  if (user.role === 'student' && sess.studentId !== userId) throw Object.assign(new Error('Access denied.'), { status: 403 });
  if (user.role === 'mentor' && sess.mentorId !== userId) throw Object.assign(new Error('Access denied.'), { status: 403 });

  const prevStatus = sess.status;
  await sess.update(updates);

  if (updates.status && updates.status !== prevStatus) {
    const history = await MentoringHistory.findOne({ where: { mentorId: sess.mentorId, studentId: sess.studentId, status: 'active' } });
    if (history) {
      if (updates.status === 'completed') await history.increment('completedSessions');
      if (updates.status === 'cancelled') await history.increment('cancelledSessions');
    }
  }

  return Session.findByPk(sess.id, { include: [participantFields('mentor'), participantFields('student')] });
}

async function deleteSession(userId, sessionId) {
  const sess = await Session.findByPk(sessionId);
  if (!sess) throw Object.assign(new Error('Session not found.'), { status: 404 });

  const user = await User.findByPk(userId);
  if (user.role === 'student' && sess.studentId !== userId) throw Object.assign(new Error('Access denied.'), { status: 403 });
  if (user.role === 'mentor' && sess.mentorId !== userId) throw Object.assign(new Error('Access denied.'), { status: 403 });

  await sess.destroy();
  return { message: 'Session deleted.' };
}

async function listHistory(userId) {
  const user = await User.findByPk(userId);
  const where = user.role === 'student' ? { studentId: userId } : { mentorId: userId };
  return MentoringHistory.findAll({
    where,
    include: [
      { model: User, as: 'mentor',  attributes: ['id','name','email','photo','company','experience'] },
      { model: User, as: 'student', attributes: ['id','name','email','photo','standard','subjects'] },
    ],
    order: [['startDate', 'DESC']],
  });
}

async function getHistoryStats(userId) {
  const user = await User.findByPk(userId);
  const where = user.role === 'student' ? { studentId: userId } : { mentorId: userId };
  const rows = await MentoringHistory.findAll({ where });
  const rated = rows.filter((r) => r.rating);
  return {
    totalRelationships:     rows.length,
    activeRelationships:    rows.filter((r) => r.status === 'active').length,
    completedRelationships: rows.filter((r) => r.status === 'completed').length,
    totalSessions:          rows.reduce((s, r) => s + r.totalSessions, 0),
    completedSessions:      rows.reduce((s, r) => s + r.completedSessions, 0),
    averageRating:          rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : null,
  };
}

async function endHistory(userId, historyId, updates) {
  const history = await MentoringHistory.findByPk(historyId);
  if (!history) throw Object.assign(new Error('Not found.'), { status: 404 });

  const user = await User.findByPk(userId);
  if (user.role === 'student' && history.studentId !== userId) throw Object.assign(new Error('Access denied.'), { status: 403 });
  if (user.role === 'mentor' && history.mentorId !== userId) throw Object.assign(new Error('Access denied.'), { status: 403 });

  await history.update({
    status: 'completed',
    endDate: new Date(),
    reasonForEnding: updates.reasonForEnding,
    rating: updates.rating,
    feedback: updates.feedback,
  });

  return history;
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