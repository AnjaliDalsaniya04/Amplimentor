'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subscriptions', {
      id:        { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      studentId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      mentorId:  { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      plan:      { type: Sequelize.ENUM('basic', 'premium', 'enterprise'), allowNull: false },
      interval:  { type: Sequelize.ENUM('monthly', 'quarterly', 'yearly'), defaultValue: 'monthly' },
      amount:    { type: Sequelize.INTEGER, allowNull: false },
      currency:  { type: Sequelize.STRING(10), defaultValue: 'inr' },
      status:    { type: Sequelize.ENUM('active', 'cancelled', 'past_due', 'expired'), defaultValue: 'active' },
      sessionsPerMonth: { type: Sequelize.INTEGER, defaultValue: 4 },
      stripeSubscriptionId: { type: Sequelize.STRING },
      stripePriceId:        { type: Sequelize.STRING },
      stripeCustomerId:     { type: Sequelize.STRING },
      currentPeriodStart: { type: Sequelize.DATE },
      currentPeriodEnd:   { type: Sequelize.DATE },
      cancelAtPeriodEnd:  { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('subscriptions', ['studentId']);
    await queryInterface.addIndex('subscriptions', ['mentorId']);
    await queryInterface.addIndex('subscriptions', ['status']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('subscriptions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_subscriptions_plan";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_subscriptions_interval";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_subscriptions_status";');
  },
};
