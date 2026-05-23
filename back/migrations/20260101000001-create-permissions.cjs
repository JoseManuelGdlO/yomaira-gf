'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permissions', {
      id: { type: Sequelize.UUID, primaryKey: true },
      code: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      description: { type: Sequelize.STRING(190), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('permissions');
  },
};
