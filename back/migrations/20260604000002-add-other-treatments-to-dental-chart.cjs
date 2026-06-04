'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('patient_dental_charts', 'other_treatments', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('patient_dental_charts', 'other_treatments');
  },
};
