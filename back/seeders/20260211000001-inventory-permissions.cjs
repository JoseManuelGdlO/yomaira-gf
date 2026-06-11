'use strict';

const { v4: uuid } = require('uuid');

const ROLE_PERMISSIONS = {
  admin: ['inventory.read', 'inventory.write'],
  doctor: ['inventory.read', 'inventory.write'],
  assistant: ['inventory.read'],
};

const NEW_PERMISSIONS = [
  ['inventory.read', 'List/view inventory and low-stock alerts'],
  ['inventory.write', 'Manage inventory items and restock'],
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const q = queryInterface.sequelize;

    const existing = await q.query('SELECT id, code FROM permissions', {
      type: q.QueryTypes.SELECT,
    });
    const permByCode = Object.fromEntries(existing.map((p) => [p.code, p.id]));

    for (const [code, description] of NEW_PERMISSIONS) {
      if (!permByCode[code]) {
        const id = uuid();
        await queryInterface.bulkInsert('permissions', [
          { id, code, description, created_at: now, updated_at: now },
        ]);
        permByCode[code] = id;
      }
    }

    const brandings = await q.query('SELECT id FROM brandings', { type: q.QueryTypes.SELECT });
    for (const branding of brandings) {
      const roles = await q.query(
        'SELECT id, name FROM roles WHERE branding_id = :brandingId',
        { replacements: { brandingId: branding.id }, type: q.QueryTypes.SELECT },
      );
      for (const role of roles) {
        const codes = ROLE_PERMISSIONS[role.name];
        if (!codes) continue;
        for (const code of codes) {
          const permissionId = permByCode[code];
          if (!permissionId) continue;
          const [dup] = await q.query(
            `SELECT role_id FROM role_permissions WHERE role_id = :roleId AND permission_id = :permissionId LIMIT 1`,
            {
              replacements: { roleId: role.id, permissionId },
              type: q.QueryTypes.SELECT,
            },
          );
          if (dup) continue;
          await queryInterface.bulkInsert('role_permissions', [
            {
              role_id: role.id,
              permission_id: permissionId,
              created_at: now,
              updated_at: now,
            },
          ]);
        }
      }
    }
  },

  async down(queryInterface) {
    const q = queryInterface.sequelize;
    const perms = await q.query(
      `SELECT id FROM permissions WHERE code IN ('inventory.read', 'inventory.write')`,
      { type: q.QueryTypes.SELECT },
    );
    const ids = perms.map((p) => p.id);
    if (ids.length) {
      await queryInterface.bulkDelete('role_permissions', { permission_id: ids });
      await queryInterface.bulkDelete('permissions', { id: ids });
    }
  },
};
