'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('finance_charges', {
      id: { type: Sequelize.UUID, primaryKey: true },
      branding_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'brandings', key: 'id' },
        onDelete: 'CASCADE',
      },
      consultation_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'consultations', key: 'id' },
        onDelete: 'CASCADE',
      },
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'patients', key: 'id' },
        onDelete: 'CASCADE',
      },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      payment_method: {
        type: Sequelize.ENUM('efectivo', 'tarjeta', 'transferencia', 'otro'),
        allowNull: false,
        defaultValue: 'efectivo',
      },
      note: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('finance_charges', ['consultation_id'], {
      unique: true,
      name: 'finance_charges_consultation_unique',
    });
    await queryInterface.addIndex('finance_charges', ['branding_id', 'date'], {
      name: 'finance_charges_branding_date',
    });

    await queryInterface.createTable('finance_expenses', {
      id: { type: Sequelize.UUID, primaryKey: true },
      branding_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'brandings', key: 'id' },
        onDelete: 'CASCADE',
      },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      category: { type: Sequelize.STRING(80), allowNull: false, defaultValue: '' },
      description: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('finance_expenses', ['branding_id', 'date'], {
      name: 'finance_expenses_branding_date',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('finance_expenses');
    await queryInterface.dropTable('finance_charges');
  },
};
