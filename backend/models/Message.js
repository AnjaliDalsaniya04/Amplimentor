'use strict';

module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    chatId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'chats', key: 'id' },
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    content:    { type: DataTypes.TEXT },
    attachment: { type: DataTypes.STRING },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'messages',
    timestamps: true,
    indexes: [
      { fields: ['chatId'] },
      { fields: ['senderId'] },
      { fields: ['createdAt'] },
    ],
  });

  return Message;
};
