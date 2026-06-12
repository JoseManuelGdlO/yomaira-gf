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
  ['inventory.read', 'List/view inventory and low-stock alerts'],
  ['inventory.write', 'Manage inventory items and restock'],
  ['finances.read', 'View charges, expenses and finance summary'],
  ['finances.write', 'Create/update/delete charges and expenses'],
  ['branding.read', 'View branding settings'],
  ['branding.write', 'Update branding settings'],
  ['clinical_questions.read', 'View clinical history questions'],
  ['clinical_questions.write', 'Manage clinical history questions'],
];

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
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('permissions', null, {});
  },
};
