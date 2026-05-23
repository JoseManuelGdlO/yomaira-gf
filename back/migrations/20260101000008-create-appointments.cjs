'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('appointments', {
      id: { type: Sequelize.UUID, primaryKey: true },
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'patients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      time: { type: Sequelize.STRING(8), allowNull: false },
      reason: { type: Sequelize.STRING(255), allowNull: false, defaultValue: '' },
      status: {
        type: Sequelize.ENUM('pendiente', 'confirmada', 'completada', 'cancelada'),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('appointments', ['date']);
    await queryInterface.addIndex('appointments', ['patient_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('appointments');
  },
};
