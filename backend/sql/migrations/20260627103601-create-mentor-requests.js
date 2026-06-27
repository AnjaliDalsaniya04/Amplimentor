'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mentor_requests', {
      id:        { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      mentorId:  { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      studentId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      message:   { type: Sequelize.TEXT, allowNull: false },
      status:    { type: Sequelize.ENUM('pending', 'accepted', 'rejected', 'removed'), defaultValue: 'pending' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('mentor_requests', ['mentorId']);
    await queryInterface.addIndex('mentor_requests', ['studentId']);
    await queryInterface.addIndex('mentor_requests', ['status']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('mentor_requests');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_mentor_requests_status";');
  },
};
