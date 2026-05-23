'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: { type: Sequelize.UUID, primaryKey: true },
      name: { type: Sequelize.STRING(60), allowNull: false, unique: true },
      description: { type: Sequelize.STRING(190), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('roles');
  },
};
