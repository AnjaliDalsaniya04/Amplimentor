'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('messages', {
      id:         { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      chatId:     { type: Sequelize.UUID, allowNull: false, references: { model: 'chats', key: 'id' }, onDelete: 'CASCADE' },
      senderId:   { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      content:    { type: Sequelize.TEXT },
      attachment: { type: Sequelize.STRING },
      isRead:     { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt:  { type: Sequelize.DATE, allowNull: false },
      updatedAt:  { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('messages', ['chatId']);
    await queryInterface.addIndex('messages', ['senderId']);
    await queryInterface.addIndex('messages', ['createdAt']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('messages');
  },
};
