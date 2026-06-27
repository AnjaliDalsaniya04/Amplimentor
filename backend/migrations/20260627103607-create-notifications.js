'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id:      { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      userId:  { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      type:    { type: Sequelize.ENUM('chat', 'mentor_request', 'session', 'payment', 'general'), defaultValue: 'general' },
      message: { type: Sequelize.TEXT, allowNull: false },
      link:    { type: Sequelize.STRING },
      isRead:  { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('notifications', ['userId']);
    await queryInterface.addIndex('notifications', ['isRead']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_type";');
  },
};
