'use strict';

module.exports = (sequelize, DataTypes) => {
  const MentoringHistory = sequelize.define('MentoringHistory', {
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
    status: {
      type: DataTypes.ENUM('active', 'completed'),
      defaultValue: 'active',
    },
    startDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    endDate:          { type: DataTypes.DATE },
    totalSessions:    { type: DataTypes.INTEGER, defaultValue: 0 },
    completedSessions:{ type: DataTypes.INTEGER, defaultValue: 0 },
    cancelledSessions:{ type: DataTypes.INTEGER, defaultValue: 0 },
    rating:           { type: DataTypes.INTEGER },
    feedback:         { type: DataTypes.TEXT },
    reasonForEnding:  { type: DataTypes.STRING },
    notes:            { type: DataTypes.TEXT },
  }, {
    tableName: 'mentoring_histories',
    timestamps: true,
    indexes: [
      { fields: ['mentorId'] },
      { fields: ['studentId'] },
      { fields: ['status'] },
    ],
  });

  return MentoringHistory;
};
