'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('patients', 'weight_kg', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('patients', 'weight_kg');
  },
};
