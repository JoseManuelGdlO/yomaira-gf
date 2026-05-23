'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('consultations', {
      id: { type: Sequelize.UUID, primaryKey: true },
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'patients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      reason: { type: Sequelize.STRING(255), allowNull: false, defaultValue: '' },
      diagnosis: { type: Sequelize.TEXT, allowNull: false },
      treatment: { type: Sequelize.TEXT, allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: false },
      doctor: { type: Sequelize.STRING(190), allowNull: false, defaultValue: '' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('consultations', ['patient_id']);
    await queryInterface.addIndex('consultations', ['date']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('consultations');
  },
};
