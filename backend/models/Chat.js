'use strict';

module.exports = (sequelize, DataTypes) => {
  const Chat = sequelize.define('Chat', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    mentorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    lastMessage: { type: DataTypes.TEXT },
    lastMessageAt: { type: DataTypes.DATE },
  }, {
    tableName: 'chats',
    timestamps: true,
    indexes: [
      { fields: ['mentorId'] },
      { fields: ['studentId'] },
      // Ensure one chat per mentor-student pair
      { unique: true, fields: ['mentorId', 'studentId'] },
    ],
  });

  return Chat;
};
