'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('treatment_budgets', 'attachment', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
    });
    await queryInterface.addColumn('treatment_budgets', 'attachment_file_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('treatment_budgets', 'attachment_file_name');
    await queryInterface.removeColumn('treatment_budgets', 'attachment');
  },
};
