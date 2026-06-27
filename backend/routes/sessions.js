'use strict';
const express = require('express');
const { User, Session, MentoringHistory } = require('../models');
const { requireAuthApi } = require('../middleware/auth');
const router  = express.Router();

const participantFields = (role) => ({ model: User, as: role, attributes: ['id','name','email','photo'] });

// GET /api/sessions
router.get('/', requireAuthApi, async (req, res) => {
  try {
    const user  = await User.findByPk(req.session.userId);
    const where = user.role === 'student' ? { studentId: req.session.userId } : { mentorId: req.session.userId };
    const sessions = await Session.findAll({
      where,
      include: [participantFields('mentor'), participantFields('student')],
      order: [['date', 'ASC']],
    });
    res.json(sessions);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/sessions
router.post('/', requireAuthApi, async (req, res) => {
  const { topic, date, notes, mentor: mentorId, student: studentId } = req.body;
  if (!topic || !date)
    return res.status(400).json({ message: 'Topic and date are required.' });
  try {
    const user = await User.findByPk(req.session.userId);
    const data = {
      topic,
      date: new Date(date),
      notes: notes || '',
      status: 'scheduled',
      mentorId:  user.role === 'student' ? mentorId  : req.session.userId,
      studentId: user.role === 'student' ? req.session.userId : studentId,
    };
    if (!data.mentorId || !data.studentId)
      return res.status(400).json({ message: 'Both mentor and student are required.' });
    const sess = await Session.create(data);
    const [history] = await MentoringHistory.findOrCreate({
      where:    { mentorId: data.mentorId, studentId: data.studentId, status: 'active' },
      defaults: { mentorId: data.mentorId, studentId: data.studentId, startDate: new Date() },
    });
    await history.increment('totalSessions');
    const populated = await Session.findByPk(sess.id, {
      include: [participantFields('mentor'), participantFields('student')],
    });
    res.status(201).json(populated);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/sessions/:id
router.put('/:id', requireAuthApi, async (req, res) => {
  try {
    const sess = await Session.findByPk(req.params.id);
    if (!sess) return res.status(404).json({ message: 'Session not found.' });
    const user = await User.findByPk(req.session.userId);
    if (user.role === 'student' && sess.studentId !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    if (user.role === 'mentor' && sess.mentorId !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    const prevStatus = sess.status;
    await sess.update(req.body);
    if (req.body.status && req.body.status !== prevStatus) {
      const history = await MentoringHistory.findOne({
        where: { mentorId: sess.mentorId, studentId: sess.studentId, status: 'active' },
      });
      if (history) {
        if (req.body.status === 'completed') await history.increment('completedSessions');
        if (req.body.status === 'cancelled') await history.increment('cancelledSessions');
      }
    }
    const populated = await Session.findByPk(sess.id, {
      include: [participantFields('mentor'), participantFields('student')],
    });
    res.json(populated);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

// DELETE /api/sessions/:id
router.delete('/:id', requireAuthApi, async (req, res) => {
  try {
    const sess = await Session.findByPk(req.params.id);
    if (!sess) return res.status(404).json({ message: 'Session not found.' });
    const user = await User.findByPk(req.session.userId);
    if (user.role === 'student' && sess.studentId !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    if (user.role === 'mentor' && sess.mentorId !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    await sess.destroy();
    res.json({ message: 'Session deleted.' });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/sessions/history
router.get('/history', requireAuthApi, async (req, res) => {
  try {
    const user  = await User.findByPk(req.session.userId);
    const where = user.role === 'student' ? { studentId: req.session.userId } : { mentorId: req.session.userId };
    const history = await MentoringHistory.findAll({
      where,
      include: [
        { model: User, as: 'mentor',  attributes: ['id','name','email','photo','company','experience'] },
        { model: User, as: 'student', attributes: ['id','name','email','photo','standard','subjects'] },
      ],
      order: [['startDate', 'DESC']],
    });
    res.json(history);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/sessions/history/stats
router.get('/history/stats', requireAuthApi, async (req, res) => {
  try {
    const user  = await User.findByPk(req.session.userId);
    const where = user.role === 'student' ? { studentId: req.session.userId } : { mentorId: req.session.userId };
    const rows  = await MentoringHistory.findAll({ where });
    const rated = rows.filter(r => r.rating);
    res.json({
      totalRelationships:     rows.length,
      activeRelationships:    rows.filter(r => r.status === 'active').length,
      completedRelationships: rows.filter(r => r.status === 'completed').length,
      totalSessions:          rows.reduce((s, r) => s + r.totalSessions, 0),
      completedSessions:      rows.reduce((s, r) => s + r.completedSessions, 0),
      averageRating:          rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : null,
    });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/sessions/history/:id/end
router.put('/history/:id/end', requireAuthApi, async (req, res) => {
  try {
    const history = await MentoringHistory.findByPk(req.params.id);
    if (!history) return res.status(404).json({ message: 'Not found.' });
    const user = await User.findByPk(req.session.userId);
    if (user.role === 'student' && history.studentId !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    if (user.role === 'mentor' && history.mentorId !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    const { reasonForEnding, rating, feedback } = req.body;
    await history.update({ status: 'completed', endDate: new Date(), reasonForEnding, rating, feedback });
    res.json(history);
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;
