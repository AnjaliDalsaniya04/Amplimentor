'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id:        { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      studentId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      mentorId:  { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      sessionId: { type: Sequelize.UUID, allowNull: true,  references: { model: 'sessions', key: 'id' }, onDelete: 'SET NULL' },
      amount:    { type: Sequelize.INTEGER, allowNull: false },
      currency:  { type: Sequelize.STRING(10), defaultValue: 'inr' },
      status:    { type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'), defaultValue: 'pending' },
      paymentMethod: { type: Sequelize.ENUM('card', 'bank_transfer', 'other'), defaultValue: 'card' },
      description: { type: Sequelize.TEXT },
      stripePaymentIntentId: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('payments', ['studentId']);
    await queryInterface.addIndex('payments', ['mentorId']);
    await queryInterface.addIndex('payments', ['status']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('payments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_paymentMethod";');
  },
};
