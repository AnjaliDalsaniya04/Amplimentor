'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chats', {
      id:        { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      mentorId:  { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      studentId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      lastMessage:   { type: Sequelize.TEXT },
      lastMessageAt: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('chats', ['mentorId']);
    await queryInterface.addIndex('chats', ['studentId']);
    await queryInterface.addIndex('chats', ['mentorId', 'studentId'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('chats');
  },
};
