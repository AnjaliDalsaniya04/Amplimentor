'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mentoring_histories', {
      id:        { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      mentorId:  { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      studentId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      status:    { type: Sequelize.ENUM('active', 'completed'), defaultValue: 'active' },
      startDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      endDate:   { type: Sequelize.DATE },
      totalSessions:     { type: Sequelize.INTEGER, defaultValue: 0 },
      completedSessions: { type: Sequelize.INTEGER, defaultValue: 0 },
      cancelledSessions: { type: Sequelize.INTEGER, defaultValue: 0 },
      rating:          { type: Sequelize.INTEGER },
      feedback:        { type: Sequelize.TEXT },
      reasonForEnding: { type: Sequelize.STRING },
      notes:           { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('mentoring_histories', ['mentorId']);
    await queryInterface.addIndex('mentoring_histories', ['studentId']);
    await queryInterface.addIndex('mentoring_histories', ['status']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('mentoring_histories');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_mentoring_histories_status";');
  },
};
