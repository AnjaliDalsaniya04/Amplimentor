'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sessions', {
      id:        { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      mentorId:  { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      studentId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      topic:     { type: Sequelize.STRING, allowNull: false },
      date:      { type: Sequelize.DATE,   allowNull: false },
      status:    { type: Sequelize.ENUM('scheduled', 'completed', 'cancelled'), defaultValue: 'scheduled' },
      notes:       { type: Sequelize.TEXT },
      meetingLink: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('sessions', ['mentorId']);
    await queryInterface.addIndex('sessions', ['studentId']);
    await queryInterface.addIndex('sessions', ['status']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('sessions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_sessions_status";');
  },
};
