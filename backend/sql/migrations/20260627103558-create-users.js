'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id:            { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name:          { type: Sequelize.STRING, allowNull: false },
      email:         { type: Sequelize.STRING, allowNull: false, unique: true },
      password:      { type: Sequelize.STRING, allowNull: false },
      role:          { type: Sequelize.ENUM('student', 'mentor'), allowNull: false },
      created_at:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      created_by:    { type: Sequelize.STRING(100), allowNull: false },
      updated_at:    { type: Sequelize.DATE, allowNull: false },
      updated_by:    { type: Sequelize.STRING(100) },
      deleted_at:    { type: Sequelize.DATE },
      deleted_by:    { type: Sequelize.STRING(100) },
      is_deleted:    { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    });
    await queryInterface.addIndex('users', ['role']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_standard";');
  },
};
