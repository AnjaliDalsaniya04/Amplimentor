'use strict';

module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
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
    plan: {
      type: DataTypes.ENUM('basic', 'premium', 'enterprise'),
      allowNull: false,
    },
    interval: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'yearly'),
      defaultValue: 'monthly',
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
      type: DataTypes.ENUM('active', 'cancelled', 'past_due', 'expired'),
      defaultValue: 'active',
    },
    sessionsPerMonth: { type: DataTypes.INTEGER, defaultValue: 4 },
    stripeSubscriptionId:   { type: DataTypes.STRING },
    stripePriceId:          { type: DataTypes.STRING },
    stripeCustomerId:       { type: DataTypes.STRING },
    currentPeriodStart:     { type: DataTypes.DATE },
    currentPeriodEnd:       { type: DataTypes.DATE },
    cancelAtPeriodEnd: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
      { fields: ['studentId'] },
      { fields: ['mentorId'] },
      { fields: ['status'] },
    ],
  });

  return Subscription;
};
