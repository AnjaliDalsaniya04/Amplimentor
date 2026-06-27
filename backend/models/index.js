'use strict';
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Import all models
const User           = require('./User')(sequelize, DataTypes);
const Session        = require('./Session')(sequelize, DataTypes);
const MentorRequest  = require('./MentorRequest')(sequelize, DataTypes);
const Chat           = require('./Chat')(sequelize, DataTypes);
const Message        = require('./Message')(sequelize, DataTypes);
const Payment        = require('./Payment')(sequelize, DataTypes);
const Subscription   = require('./Subscription')(sequelize, DataTypes);
const Notification   = require('./Notification')(sequelize, DataTypes);
const MentoringHistory = require('./MentoringHistory')(sequelize, DataTypes);

// ── Associations ──────────────────────────────────────────────

// User ↔ Session
User.hasMany(Session, { foreignKey: 'mentorId', as: 'mentorSessions' });
User.hasMany(Session, { foreignKey: 'studentId', as: 'studentSessions' });
Session.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });
Session.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// User ↔ MentorRequest
User.hasMany(MentorRequest, { foreignKey: 'mentorId', as: 'receivedRequests' });
User.hasMany(MentorRequest, { foreignKey: 'studentId', as: 'sentRequests' });
MentorRequest.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });
MentorRequest.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// User ↔ Chat
User.hasMany(Chat, { foreignKey: 'mentorId', as: 'mentorChats' });
User.hasMany(Chat, { foreignKey: 'studentId', as: 'studentChats' });
Chat.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });
Chat.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// Chat ↔ Message
Chat.hasMany(Message, { foreignKey: 'chatId', as: 'messages' });
Message.belongsTo(Chat, { foreignKey: 'chatId' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// User ↔ Payment
User.hasMany(Payment, { foreignKey: 'studentId', as: 'payments' });
User.hasMany(Payment, { foreignKey: 'mentorId', as: 'receivedPayments' });
Payment.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Payment.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });
Payment.belongsTo(Session, { foreignKey: 'sessionId', as: 'session' });

// User ↔ Subscription
User.hasMany(Subscription, { foreignKey: 'studentId', as: 'subscriptions' });
User.hasMany(Subscription, { foreignKey: 'mentorId', as: 'mentorSubscriptions' });
Subscription.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Subscription.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });

// User ↔ Notification
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// User ↔ MentoringHistory
User.hasMany(MentoringHistory, { foreignKey: 'mentorId', as: 'mentorHistories' });
User.hasMany(MentoringHistory, { foreignKey: 'studentId', as: 'studentHistories' });
MentoringHistory.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' });
MentoringHistory.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

module.exports = {
  sequelize,
  User,
  Session,
  MentorRequest,
  Chat,
  Message,
  Payment,
  Subscription,
  Notification,
  MentoringHistory,
};
