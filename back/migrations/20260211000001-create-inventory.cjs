'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory_items', {
      id: { type: Sequelize.UUID, primaryKey: true },
      branding_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'brandings', key: 'id' }, onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(190), allowNull: false },
      unit: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'unidades' },
      quantity: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      min_quantity: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 5 },
      category: { type: Sequelize.STRING(80), allowNull: false, defaultValue: '' },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('inventory_items', ['branding_id', 'name'], {
      name: 'inventory_items_branding_name',
    });

    await queryInterface.createTable('consultation_inventory_usages', {
      id: { type: Sequelize.UUID, primaryKey: true },
      consultation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'consultations', key: 'id' },
        onDelete: 'CASCADE',
      },
      inventory_item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'inventory_items', key: 'id' },
        onDelete: 'RESTRICT',
      },
      quantity: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('consultation_inventory_usages', ['consultation_id', 'inventory_item_id'], {
      unique: true,
      name: 'consultation_inventory_usages_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('consultation_inventory_usages');
    await queryInterface.dropTable('inventory_items');
  },
};
