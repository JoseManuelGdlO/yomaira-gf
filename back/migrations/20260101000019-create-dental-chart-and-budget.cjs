'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('patient_dental_charts', {
      id: { type: Sequelize.UUID, primaryKey: true },
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'patients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      branding_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'brandings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      tooth_treatments: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
      frankl: {
        type: Sequelize.ENUM('na', 'I', 'II', 'III', 'IV'),
        allowNull: false,
        defaultValue: 'na',
      },
      dentition: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
      atm: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      ganglios: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      soft_tissues: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      frenula: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('treatment_budgets', {
      id: { type: Sequelize.UUID, primaryKey: true },
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'patients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      branding_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'brandings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('active', 'superseded'),
        allowNull: false,
        defaultValue: 'active',
      },
      items: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
      notes: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('treatment_budgets', ['patient_id', 'status']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('treatment_budgets');
    await queryInterface.dropTable('patient_dental_charts');
  },
};
