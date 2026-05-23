'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('prescriptions', {
      id: { type: Sequelize.UUID, primaryKey: true },
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'patients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      diagnosis: { type: Sequelize.STRING(255), allowNull: false, defaultValue: '' },
      indications: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('prescriptions', ['patient_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('prescriptions');
  },
};
