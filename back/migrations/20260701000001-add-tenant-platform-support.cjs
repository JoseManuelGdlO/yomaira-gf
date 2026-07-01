'use strict';

const { v4: uuid } = require('uuid');

const TENANT_PERMISSIONS = [
  ['tenants.read', 'List/view consultorios (tenants)'],
  ['tenants.write', 'Create/update consultorios (tenants)'],
  ['tenants.delete', 'Deactivate consultorios (tenants)'],
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.addColumn('brandings', 'active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    const permRows = TENANT_PERMISSIONS.map(([code, description]) => ({
      id: uuid(),
      code,
      description,
      created_at: now,
      updated_at: now,
    }));
    await queryInterface.bulkInsert('permissions', permRows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('permissions', {
      code: TENANT_PERMISSIONS.map(([code]) => code),
    });
    await queryInterface.removeColumn('brandings', 'active');
  },
};
