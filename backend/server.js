require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express    = require('express');
const path       = require('path');
const bodyParser = require('body-parser');
const bcrypt     = require('bcrypt');
const session    = require('express-session');
const multer     = require('multer');
const { Op }     = require('sequelize');
// Stripe is optional - only active when STRIPE_SECRET_KEY is set in .env
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const app  = express();
const PORT = process.env.PORT || 3000;

const { connectDB } = require('./config/database');
const {
  sequelize,
  User, Session, MentorRequest, Chat, Message,
  Payment, Subscription, Notification, MentoringHistory,
} = require('./models');

// ── File Upload Setup ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../frontend/public/uploads/')),
  filename:    (req, file, cb) => cb(null, `${req.session.userId}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// ── Middleware ────────────────────────────────────────────────
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
}));
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/uploads', express.static(path.join(__dirname, '../frontend/public/uploads')));

// ── Auth Guards ───────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}
function requireRole(role) {
  return async (req, res, next) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
      const user = await User.findByPk(req.session.userId);
      if (!user || user.role !== role) return res.redirect('/login');
      next();
    } catch { return res.redirect('/login'); }
  };
}
function requireAuthApi(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ message: 'Not authenticated.' });
  next();
}
function requireRoleApi(role) {
  return async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ message: 'Not authenticated.' });
    try {
      const user = await User.findByPk(req.session.userId);
      if (!user || user.role !== role) return res.status(403).json({ message: `Access denied. ${role} role required.` });
      req.currentUser = user;
      next();
    } catch { return res.status(500).json({ message: 'Server error.' }); }
  };
}

// ── Page Routes ───────────────────────────────────────────────
const pub = (file) => path.join(__dirname, '../frontend/public', file);
app.get('/',                   (req, res) => res.sendFile(pub('index.html')));
app.get('/register',           (req, res) => res.sendFile(pub('register.html')));
app.get('/login',              (req, res) => res.sendFile(pub('login.html')));
app.get('/student-dashboard.html', requireRole('student'), (req, res) => res.sendFile(pub('student-dashboard.html')));
app.get('/mentor-dashboard.html',  requireRole('mentor'),  (req, res) => res.sendFile(pub('mentor-dashboard.html')));
app.get('/student/profile',    requireRole('student'), (req, res) => res.sendFile(pub('student-profile.html')));
app.get('/mentor/profile',     requireRole('mentor'),  (req, res) => res.sendFile(pub('mentor-profile.html')));
app.get('/student/mentors',    requireRole('student'), (req, res) => res.sendFile(pub('mentor-list.html')));
app.get('/my-students.html',   requireRole('mentor'),  (req, res) => res.sendFile(pub('my-students.html')));
app.get('/chat.html',          requireAuth,            (req, res) => res.sendFile(pub('chat.html')));
app.get('/chat-history.html',  requireAuth,            (req, res) => res.sendFile(pub('chat-history.html')));
app.get('/sessions.html',      requireAuth,            (req, res) => res.sendFile(pub('sessions.html')));
app.get('/payment',            requireRole('student'), (req, res) => res.sendFile(pub('payment.html')));
app.get('/payment-history',    requireAuth,            (req, res) => res.sendFile(pub('payment-history.html')));
app.get('/mentor-pricing',     requireRole('mentor'),  (req, res) => res.sendFile(pub('mentor-pricing.html')));

// ── AUTH ──────────────────────────────────────────────────────
app.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ message: 'All fields are required.' });
  if (!['student', 'mentor'].includes(role))
    return res.status(400).json({ message: 'Role must be student or mentor.' });
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });
    req.session.userId = user.id;
    res.status(201).json({ message: 'Registration successful!', user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password.' });
    req.session.userId = user.id;
    res.json({ message: 'Login successful!', user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

app.get('/logout',  (req, res) => { req.session.destroy(); res.redirect('/login'); });
app.post('/logout', (req, res) => { req.session.destroy(); res.json({ message: 'Logged out.' }); });

// ── PROFILE ───────────────────────────────────────────────────
const userPublicFields = ['id','name','email','role','photo','bio','phoneNumber','address',
  'dateOfBirth','linkedIn','github','portfolio','studentId','standard','university','subjects',
  'gpa','careerGoals','skillsToDevelop','areasOfInterest','meetingFrequency','communicationPreference',
  'company','experience','location','expertiseAreas','technicalSkills','industry','mentoringStyle',
  'availability','maxStudents','education','certifications','hourlyRate','sessionRate','subscriptionPlans'];

app.get('/api/profile', requireAuthApi, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId, { attributes: userPublicFields });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.get('/api/student/profile', requireRoleApi('student'), async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId, { attributes: userPublicFields });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.get('/api/mentor/profile', requireRoleApi('mentor'), async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId, { attributes: userPublicFields });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.put('/api/student/profile', requireRoleApi('student'), async (req, res) => {
  try {
    const allowed = ['name','bio','phoneNumber','address','dateOfBirth','linkedIn','github',
      'studentId','standard','university','subjects','gpa','careerGoals','skillsToDevelop',
      'areasOfInterest','meetingFrequency','communicationPreference'];
    const data = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
    await User.update(data, { where: { id: req.session.userId } });
    const user = await User.findByPk(req.session.userId, { attributes: userPublicFields });
    res.json(user);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

app.put('/api/mentor/profile', requireRoleApi('mentor'), async (req, res) => {
  try {
    const allowed = ['name','bio','phoneNumber','address','linkedIn','github','portfolio',
      'company','experience','location','expertiseAreas','technicalSkills','industry',
      'mentoringStyle','availability','maxStudents','education','certifications',
      'meetingFrequency','communicationPreference'];
    const data = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
    await User.update(data, { where: { id: req.session.userId } });
    const user = await User.findByPk(req.session.userId, { attributes: userPublicFields });
    res.json(user);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

app.post('/api/student/upload-photo', requireRoleApi('student'), upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  try {
    await User.update({ photo: req.file.filename }, { where: { id: req.session.userId } });
    res.json({ success: true, filename: req.file.filename });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.post('/api/mentor/upload-photo', requireRoleApi('mentor'), upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  try {
    await User.update({ photo: req.file.filename }, { where: { id: req.session.userId } });
    res.json({ success: true, filename: req.file.filename });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// ── MENTORS BROWSE ────────────────────────────────────────────
app.get('/api/mentors', requireAuthApi, async (req, res) => {
  try {
    const mentors = await User.findAll({
      where: { role: 'mentor' },
      attributes: ['id','name','email','photo','company','experience','location',
        'expertiseAreas','technicalSkills','bio','hourlyRate','sessionRate','availability','subjects'],
      order: [['name', 'ASC']],
    });
    res.json(mentors);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.get('/api/mentor/:mentorId', requireAuthApi, async (req, res) => {
  try {
    const mentor = await User.findOne({
      where: { id: req.params.mentorId, role: 'mentor' },
      attributes: userPublicFields,
    });
    if (!mentor) return res.status(404).json({ message: 'Mentor not found.' });
    res.json(mentor);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// ── MENTOR REQUESTS ───────────────────────────────────────────
app.post('/api/mentor-requests', requireRoleApi('student'), async (req, res) => {
  const { mentorId, message } = req.body;
  if (!mentorId || !message) return res.status(400).json({ message: 'mentorId and message are required.' });
  try {
    const mentor = await User.findOne({ where: { id: mentorId, role: 'mentor' } });
    if (!mentor) return res.status(404).json({ message: 'Mentor not found.' });
    const existing = await MentorRequest.findOne({
      where: { studentId: req.session.userId, mentorId, status: { [Op.in]: ['pending', 'accepted'] } },
    });
    if (existing) return res.status(409).json({ message: 'Request already exists.' });
    const request = await MentorRequest.create({ studentId: req.session.userId, mentorId, message });
    // Notify mentor
    await Notification.create({
      userId: mentorId, type: 'mentor_request',
      message: `New mentoring request from a student.`, link: '/mentor-dashboard.html',
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

app.get('/api/mentor/requests', requireRoleApi('mentor'), async (req, res) => {
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
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.get('/api/student/requests', requireRoleApi('student'), async (req, res) => {
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
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.put('/api/mentor-requests/:id', requireRoleApi('mentor'), async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected', 'removed'].includes(status))
    return res.status(400).json({ message: 'Invalid status.' });
  try {
    const request = await MentorRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.mentorId !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    await request.update({ status });
    // Notify student
    const msg = status === 'accepted' ? 'Your mentoring request was accepted!' : `Your mentoring request was ${status}.`;
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

app.get('/api/mentor/students', requireRoleApi('mentor'), async (req, res) => {
  try {
    const requests = await MentorRequest.findAll({
      where: { mentorId: req.session.userId, status: 'accepted' },
      include: [{ model: User, as: 'student', attributes: ['id','name','email','photo','standard','subjects'] }],
    });
    res.json(requests.map(r => r.student));
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.get('/api/student/mentors', requireRoleApi('student'), async (req, res) => {
  try {
    const requests = await MentorRequest.findAll({
      where: { studentId: req.session.userId, status: 'accepted' },
      include: [{ model: User, as: 'mentor', attributes: ['id','name','email','photo','company','experience'] }],
    });
    res.json(requests.map(r => r.mentor));
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// ── SESSIONS ──────────────────────────────────────────────────
app.get('/api/sessions', requireAuthApi, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId);
    const where = user.role === 'student' ? { studentId: req.session.userId } : { mentorId: req.session.userId };
    const sessions = await Session.findAll({
      where,
      include: [
        { model: User, as: 'mentor',  attributes: ['id','name','email','photo'] },
        { model: User, as: 'student', attributes: ['id','name','email','photo'] },
      ],
      order: [['date', 'ASC']],
    });
    res.json(sessions);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.post('/api/sessions', requireAuthApi, async (req, res) => {
  const { topic, date, notes, mentor: mentorId, student: studentId } = req.body;
  if (!topic || !date) return res.status(400).json({ message: 'Topic and date are required.' });
  try {
    const user = await User.findByPk(req.session.userId);
    const data = {
      topic, date: new Date(date), notes: notes || '', status: 'scheduled',
      mentorId: user.role === 'student' ? mentorId  : req.session.userId,
      studentId: user.role === 'student' ? req.session.userId : studentId,
    };
    if (!data.mentorId || !data.studentId)
      return res.status(400).json({ message: 'Both mentor and student are required.' });
    const sess = await Session.create(data);
    // Update mentoring history total count
    const [history] = await MentoringHistory.findOrCreate({
      where: { mentorId: data.mentorId, studentId: data.studentId, status: 'active' },
      defaults: { mentorId: data.mentorId, studentId: data.studentId, startDate: new Date() },
    });
    await history.increment('totalSessions');
    const populated = await Session.findByPk(sess.id, {
      include: [
        { model: User, as: 'mentor',  attributes: ['id','name','email','photo'] },
        { model: User, as: 'student', attributes: ['id','name','email','photo'] },
      ],
    });
    res.status(201).json(populated);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

app.put('/api/sessions/:id', requireAuthApi, async (req, res) => {
  try {
    const sess = await Session.findByPk(req.params.id);
    if (!sess) return res.status(404).json({ message: 'Session not found.' });
    const user = await User.findByPk(req.session.userId);
    if (user.role === 'student' && sess.studentId !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    if (user.role === 'mentor'  && sess.mentorId  !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    const prevStatus = sess.status;
    await sess.update(req.body);
    // Update history on status change
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
      include: [
        { model: User, as: 'mentor',  attributes: ['id','name','email','photo'] },
        { model: User, as: 'student', attributes: ['id','name','email','photo'] },
      ],
    });
    res.json(populated);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

app.delete('/api/sessions/:id', requireAuthApi, async (req, res) => {
  try {
    const sess = await Session.findByPk(req.params.id);
    if (!sess) return res.status(404).json({ message: 'Session not found.' });
    const user = await User.findByPk(req.session.userId);
    if (user.role === 'student' && sess.studentId !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    if (user.role === 'mentor'  && sess.mentorId  !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    await sess.destroy();
    res.json({ message: 'Session deleted.' });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// ── MENTORING HISTORY ─────────────────────────────────────────
app.get('/api/mentoring-history', requireAuthApi, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId);
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
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.get('/api/mentoring-history/stats', requireAuthApi, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId);
    const where = user.role === 'student' ? { studentId: req.session.userId } : { mentorId: req.session.userId };
    const rows = await MentoringHistory.findAll({ where });
    const stats = {
      totalRelationships:     rows.length,
      activeRelationships:    rows.filter(r => r.status === 'active').length,
      completedRelationships: rows.filter(r => r.status === 'completed').length,
      totalSessions:          rows.reduce((s, r) => s + r.totalSessions, 0),
      completedSessions:      rows.reduce((s, r) => s + r.completedSessions, 0),
      averageRating:          rows.filter(r => r.rating).length
        ? rows.filter(r => r.rating).reduce((s, r) => s + r.rating, 0) / rows.filter(r => r.rating).length
        : null,
    };
    res.json(stats);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.put('/api/mentoring-history/:id/end', requireAuthApi, async (req, res) => {
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
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// ── CHAT ──────────────────────────────────────────────────────
app.get('/api/chats', requireAuthApi, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId);
    const where = user.role === 'student'
      ? { studentId: req.session.userId }
      : { mentorId:  req.session.userId };
    const chats = await Chat.findAll({
      where,
      include: [
        { model: User, as: 'mentor',  attributes: ['id','name','photo'] },
        { model: User, as: 'student', attributes: ['id','name','photo'] },
        { model: Message, as: 'messages', attributes: ['id','content','senderId','createdAt','attachment'],
          limit: 1, order: [['createdAt','DESC']] },
      ],
      order: [['lastMessageAt', 'DESC']],
    });
    res.json(chats);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

app.get('/api/chats/:chatId/messages', requireAuthApi, async (req, res) => {
  try {
    const chat = await Chat.findByPk(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });
    if (chat.mentorId !== req.session.userId && chat.studentId !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    const since = req.query.since;
    const where = since ? { chatId: req.params.chatId, createdAt: { [Op.gt]: new Date(since) } }
                        : { chatId: req.params.chatId };
    const messages = await Message.findAll({
      where,
      include: [{ model: User, as: 'sender', attributes: ['id','name','photo'] }],
      order: [['createdAt', 'ASC']],
    });
    res.json(messages);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.post('/api/chats/:chatId/messages', requireAuthApi, upload.single('attachment'), async (req, res) => {
  try {
    const chat = await Chat.findByPk(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });
    if (chat.mentorId !== req.session.userId && chat.studentId !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    const { content } = req.body;
    if (!content && !req.file) return res.status(400).json({ message: 'Message or attachment required.' });
    const msg = await Message.create({
      chatId: req.params.chatId,
      senderId: req.session.userId,
      content: content || '',
      attachment: req.file ? req.file.filename : null,
    });
    // Update chat last message
    await chat.update({ lastMessage: content || 'Attachment', lastMessageAt: new Date() });
    // Notify the other participant
    const recipientId = chat.mentorId === req.session.userId ? chat.studentId : chat.mentorId;
    await Notification.create({
      userId: recipientId, type: 'chat',
      message: 'You have a new message.', link: '/chat.html',
    });
    const populated = await Message.findByPk(msg.id, {
      include: [{ model: User, as: 'sender', attributes: ['id','name','photo'] }],
    });
    res.status(201).json(populated);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

// Create a new chat (or return existing one)
app.post('/api/chats', requireAuthApi, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId);
    const otherId = req.body.mentorId || req.body.studentId;
    if (!otherId) return res.status(400).json({ message: 'Other participant ID required.' });
    let mentorId, studentId;
    if (user.role === 'student') { studentId = user.id; mentorId = otherId; }
    else                         { mentorId = user.id;  studentId = otherId; }
    const [chat] = await Chat.findOrCreate({ where: { mentorId, studentId }, defaults: { mentorId, studentId } });
    res.json(chat);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// ── NOTIFICATIONS ─────────────────────────────────────────────
app.get('/api/notifications', requireAuthApi, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.session.userId, isRead: false },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    res.json({ count: notifications.length, notifications });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.put('/api/notifications/:id/read', requireAuthApi, async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { id: req.params.id, userId: req.session.userId } });
    res.json({ message: 'Notification marked as read.' });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// ── PAYMENT ───────────────────────────────────────────────────
app.get('/api/payment/config', (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});

app.post('/api/payment/create-payment-intent', requireRoleApi('student'), async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Payment system not configured.' });
  const { mentorId, sessionId, amount, description } = req.body;
  if (!mentorId || !amount) return res.status(400).json({ message: 'mentorId and amount are required.' });
  try {
    let stripeCustomerId = req.currentUser.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: req.currentUser.email, name: req.currentUser.name });
      stripeCustomerId = customer.id;
      await User.update({ stripeCustomerId }, { where: { id: req.session.userId } });
    }
    const intent = await stripe.paymentIntents.create({
      amount: parseInt(amount),
      currency: 'inr',
      customer: stripeCustomerId,
      description: description || 'Mentoring session',
      metadata: { mentorId, sessionId: sessionId || '', studentId: req.session.userId },
    });
    const payment = await Payment.create({
      studentId: req.session.userId, mentorId, sessionId: sessionId || null,
      amount: parseInt(amount), description, stripePaymentIntentId: intent.id, status: 'pending',
    });
    res.json({ clientSecret: intent.client_secret, paymentId: payment.id });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

app.post('/api/payment/confirm', requireAuthApi, async (req, res) => {
  const { paymentIntentId, paymentId } = req.body;
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const status = intent.status === 'succeeded' ? 'completed' : 'failed';
    await Payment.update({ status }, { where: { id: paymentId } });
    res.json({ message: status === 'completed' ? 'Payment confirmed.' : 'Payment failed.' });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.post('/api/payment/create-subscription', requireRoleApi('student'), async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Payment system not configured.' });
  const { mentorId, plan, interval, priceId, amount, sessionsPerMonth } = req.body;
  if (!mentorId || !plan || !priceId) return res.status(400).json({ message: 'mentorId, plan, and priceId are required.' });
  try {
    let stripeCustomerId = req.currentUser.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: req.currentUser.email, name: req.currentUser.name });
      stripeCustomerId = customer.id;
      await User.update({ stripeCustomerId }, { where: { id: req.session.userId } });
    }
    const stripeSub = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    const sub = await Subscription.create({
      studentId: req.session.userId, mentorId, plan, interval: interval || 'monthly',
      amount: amount || 0, stripeSubscriptionId: stripeSub.id, stripePriceId: priceId,
      stripeCustomerId, sessionsPerMonth: sessionsPerMonth || 4, status: 'active',
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd:   new Date(stripeSub.current_period_end   * 1000),
    });
    res.json({ subscriptionId: sub.id, clientSecret: stripeSub.latest_invoice.payment_intent.client_secret });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

app.post('/api/payment/cancel-subscription', requireRoleApi('student'), async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Payment system not configured.' });
  const { subscriptionId } = req.body;
  try {
    const sub = await Subscription.findByPk(subscriptionId);
    if (!sub) return res.status(404).json({ message: 'Subscription not found.' });
    if (sub.studentId !== req.session.userId) return res.status(403).json({ message: 'Access denied.' });
    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
    await sub.update({ cancelAtPeriodEnd: true });
    res.json({ message: 'Subscription will be cancelled at end of billing period.' });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.get('/api/payment/history', requireAuthApi, async (req, res) => {
  try {
    const userId = req.session.userId;
    const payments = await Payment.findAll({
      where: { studentId: userId },
      include: [{ model: User, as: 'mentor', attributes: ['id','name','email'] }],
      order: [['createdAt', 'DESC']],
    });
    const subscriptions = await Subscription.findAll({
      where: { studentId: userId },
      include: [{ model: User, as: 'mentor', attributes: ['id','name','email'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ payments, subscriptions });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.get('/api/mentor/pricing', requireRoleApi('mentor'), async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId, {
      attributes: ['hourlyRate', 'sessionRate', 'subscriptionPlans'],
    });
    res.json(user);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.put('/api/mentor/pricing', requireRoleApi('mentor'), async (req, res) => {
  const { hourlyRate, sessionRate, subscriptionPlans } = req.body;
  try {
    await User.update({ hourlyRate, sessionRate, subscriptionPlans }, { where: { id: req.session.userId } });
    res.json({ message: 'Pricing updated.' });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// Stripe webhook
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Payment system not configured.' });
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err) {
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await Payment.update({ status: 'completed' }, { where: { stripePaymentIntentId: event.data.object.id } });
        break;
      case 'payment_intent.payment_failed':
        await Payment.update({ status: 'failed' }, { where: { stripePaymentIntentId: event.data.object.id } });
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object;
        const statusMap = { active: 'active', canceled: 'cancelled', past_due: 'past_due' };
        await Subscription.update(
          { status: statusMap[stripeSub.status] || 'expired', cancelAtPeriodEnd: stripeSub.cancel_at_period_end },
          { where: { stripeSubscriptionId: stripeSub.id } }
        );
        break;
      }
    }
    res.json({ received: true });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Webhook handler error.' }); }
});

// ── START SERVER ──────────────────────────────────────────────
(async () => {
  await connectDB();
  // Sync tables (creates if not exist, does NOT drop data)
  await sequelize.sync({ alter: false });
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
})();
