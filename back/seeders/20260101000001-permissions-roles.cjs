'use strict';

const { v4: uuid } = require('uuid');

const PERMISSIONS = [
  ['users.read', 'List/view users'],
  ['users.write', 'Create/update users'],
  ['users.delete', 'Delete users'],
  ['roles.read', 'List/view roles and permissions'],
  ['roles.write', 'Create/update roles and assign permissions'],
  ['patients.read', 'List/view patients'],
  ['patients.write', 'Create/update patients'],
  ['patients.delete', 'Delete patients'],
  ['appointments.read', 'List/view appointments'],
  ['appointments.write', 'Create/update appointments'],
  ['appointments.delete', 'Delete appointments'],
  ['consultations.read', 'List/view consultations'],
  ['consultations.write', 'Create/update consultations'],
  ['consultations.delete', 'Delete consultations'],
  ['prescriptions.read', 'List/view prescriptions'],
  ['prescriptions.write', 'Create/update prescriptions'],
  ['prescriptions.delete', 'Delete prescriptions'],
  ['medications.read', 'List/view medications catalog'],
  ['medications.write', 'Manage medications catalog'],
  ['branding.read', 'View branding settings'],
  ['branding.write', 'Update branding settings'],
  ['clinical_questions.read', 'View clinical history questions'],
  ['clinical_questions.write', 'Manage clinical history questions'],
];

const ROLES = {
  admin: {
    description: 'Full system access',
    permissions: PERMISSIONS.map(([code]) => code),
  },
  doctor: {
    description: 'Medical staff with full clinical access',
    permissions: [
      'patients.read',
      'patients.write',
      'patients.delete',
      'appointments.read',
      'appointments.write',
      'appointments.delete',
      'consultations.read',
      'consultations.write',
      'consultations.delete',
      'prescriptions.read',
      'prescriptions.write',
      'prescriptions.delete',
      'medications.read',
      'medications.write',
      'branding.read',
      'branding.write',
      'clinical_questions.read',
      'clinical_questions.write',
    ],
  },
  assistant: {
    description: 'Front-desk assistant',
    permissions: [
      'patients.read',
      'patients.write',
      'appointments.read',
      'appointments.write',
      'consultations.read',
      'prescriptions.read',
      'medications.read',
      'branding.read',
      'clinical_questions.read',
    ],
  },
};

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const permRows = PERMISSIONS.map(([code, description]) => ({
      id: uuid(),
      code,
      description,
      created_at: now,
      updated_at: now,
    }));
    await queryInterface.bulkInsert('permissions', permRows);
    const permByCode = Object.fromEntries(permRows.map((p) => [p.code, p.id]));

    const roleRows = Object.entries(ROLES).map(([name, def]) => ({
      id: uuid(),
      name,
      description: def.description,
      created_at: now,
      updated_at: now,
    }));
    await queryInterface.bulkInsert('roles', roleRows);
    const roleByName = Object.fromEntries(roleRows.map((r) => [r.name, r.id]));

    const rolePermRows = [];
    for (const [name, def] of Object.entries(ROLES)) {
      for (const code of def.permissions) {
        rolePermRows.push({
          role_id: roleByName[name],
          permission_id: permByCode[code],
          created_at: now,
          updated_at: now,
        });
      }
    }
    await queryInterface.bulkInsert('role_permissions', rolePermRows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('roles', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
  },
};
