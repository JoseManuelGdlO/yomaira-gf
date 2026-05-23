'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, primaryKey: true },
      email: { type: Sequelize.STRING(190), allowNull: false, unique: true },
      password: { type: Sequelize.STRING(255), allowNull: false },
      name: { type: Sequelize.STRING(190), allowNull: false },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
