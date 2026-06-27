'use strict';

module.exports = (sequelize, DataTypes) => {
  const MentorRequest = sequelize.define('MentorRequest', {
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
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'removed'),
      defaultValue: 'pending',
    },
  }, {
    tableName: 'mentor_requests',
    timestamps: true,
    indexes: [
      { fields: ['mentorId'] },
      { fields: ['studentId'] },
      { fields: ['status'] },
    ],
  });

  return MentorRequest;
};
