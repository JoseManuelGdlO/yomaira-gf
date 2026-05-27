'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('consultations', 'next_treatment', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    });
    await queryInterface.addColumn('consultations', 'payment_and_next_appointment', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    });
    await queryInterface.addColumn('consultations', 'evolution_note', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('consultations', 'next_treatment');
    await queryInterface.removeColumn('consultations', 'payment_and_next_appointment');
    await queryInterface.removeColumn('consultations', 'evolution_note');
  },
};
