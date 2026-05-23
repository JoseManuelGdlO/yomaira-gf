'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('medications', {
      id: { type: Sequelize.UUID, primaryKey: true },
      name: { type: Sequelize.STRING(190), allowNull: false },
      presentation: { type: Sequelize.STRING(190), allowNull: false, defaultValue: '' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('medications');
  },
};
