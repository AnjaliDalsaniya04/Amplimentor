'use strict';

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    mentorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'sessions', key: 'id' },
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'inr',
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending',
    },
    paymentMethod: {
      type: DataTypes.ENUM('card', 'bank_transfer', 'other'),
      defaultValue: 'card',
    },
    description: { type: DataTypes.TEXT },
    stripePaymentIntentId: { type: DataTypes.STRING },
  }, {
    tableName: 'payments',
    timestamps: true,
    indexes: [
      { fields: ['studentId'] },
      { fields: ['mentorId'] },
      { fields: ['status'] },
    ],
  });

  return Payment;
};
