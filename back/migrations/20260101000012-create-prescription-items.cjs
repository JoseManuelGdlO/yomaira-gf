'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('prescription_items', {
      id: { type: Sequelize.UUID, primaryKey: true },
      prescription_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'prescriptions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      medication: { type: Sequelize.STRING(255), allowNull: false, defaultValue: '' },
      dose: { type: Sequelize.STRING(120), allowNull: false, defaultValue: '' },
      frequency: { type: Sequelize.STRING(120), allowNull: false, defaultValue: '' },
      duration: { type: Sequelize.STRING(120), allowNull: false, defaultValue: '' },
      position: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('prescription_items', ['prescription_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('prescription_items');
  },
};
