'use strict';

const { v4: uuid } = require('uuid');

const ROLES = {
  admin: {
    description: 'Full system access',
    permissions: [
      'users.read', 'users.write', 'users.delete',
      'roles.read', 'roles.write',
      'patients.read', 'patients.write', 'patients.delete',
      'appointments.read', 'appointments.write', 'appointments.delete',
      'consultations.read', 'consultations.write', 'consultations.delete',
      'prescriptions.read', 'prescriptions.write', 'prescriptions.delete',
      'medications.read', 'medications.write',
      'inventory.read', 'inventory.write',
      'finances.read', 'finances.write',
      'branding.read', 'branding.write',
      'clinical_questions.read', 'clinical_questions.write',
    ],
  },
  doctor: {
    description: 'Medical staff with full clinical access',
    permissions: [
      'patients.read', 'patients.write', 'patients.delete',
      'appointments.read', 'appointments.write', 'appointments.delete',
      'consultations.read', 'consultations.write', 'consultations.delete',
      'prescriptions.read', 'prescriptions.write', 'prescriptions.delete',
      'medications.read', 'medications.write',
      'inventory.read', 'inventory.write',
      'finances.read', 'finances.write',
      'branding.read', 'branding.write',
      'clinical_questions.read', 'clinical_questions.write',
    ],
  },
  assistant: {
    description: 'Front-desk assistant',
    permissions: [
      'patients.read', 'patients.write',
      'appointments.read', 'appointments.write',
      'consultations.read',
      'prescriptions.read',
      'medications.read',
      'inventory.read',
      'finances.read', 'finances.write',
      'branding.read',
      'clinical_questions.read',
    ],
  },
};

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const brandings = await queryInterface.sequelize.query(
      'SELECT id FROM brandings ORDER BY created_at ASC',
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    if (!brandings.length) throw new Error('Run branding seeder first');

    const permissions = await queryInterface.sequelize.query(
      'SELECT id, code FROM permissions',
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    const permByCode = Object.fromEntries(permissions.map((p) => [p.code, p.id]));

    for (const branding of brandings) {
      for (const [name, def] of Object.entries(ROLES)) {
        const roleId = uuid();
        await queryInterface.bulkInsert('roles', [
          {
            id: roleId,
            branding_id: branding.id,
            name,
            description: def.description,
            created_at: now,
            updated_at: now,
          },
        ]);

        const rolePermRows = def.permissions
          .filter((code) => permByCode[code])
          .map((code) => ({
            role_id: roleId,
            permission_id: permByCode[code],
            created_at: now,
            updated_at: now,
          }));
        if (rolePermRows.length) {
          await queryInterface.bulkInsert('role_permissions', rolePermRows);
        }
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  },
};
