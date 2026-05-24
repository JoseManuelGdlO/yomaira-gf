'use strict';

const { v4: uuid } = require('uuid');

const TABLES = ['users', 'roles', 'patients', 'appointments', 'medications', 'clinical_questions', 'notification_logs'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const q = queryInterface.sequelize;

    const [brandings] = await q.query(
      "SELECT id FROM brandings WHERE is_default = true ORDER BY created_at ASC LIMIT 1",
    );
    let defaultBrandingId = brandings[0]?.id;
    if (!defaultBrandingId) {
      const [any] = await q.query('SELECT id FROM brandings ORDER BY created_at ASC LIMIT 1');
      defaultBrandingId = any[0]?.id;
    }
    if (!defaultBrandingId) {
      const now = new Date();
      defaultBrandingId = uuid();
      await queryInterface.bulkInsert('brandings', [
        {
          id: defaultBrandingId,
          slug: 'default',
          clinic_name: 'MedFlow',
          doctor_name: 'Administrador',
          specialty: 'Medicina general',
          primary: '0.55 0.25 320',
          secondary: '0.85 0.09 320',
          accent: '0.45 0.13 265',
          surface: '0.985 0.008 320',
          sidebar: '0.99 0.005 320',
          primary_hex: '#B100D4',
          secondary_hex: '#DDB7E8',
          accent_hex: '#2D4D8F',
          rx_footer: 'MedFlow',
          is_default: true,
          created_at: now,
          updated_at: now,
        },
      ]);
    }

    for (const table of TABLES) {
      await queryInterface.addColumn(table, 'branding_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'brandings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });
      await q.query(`UPDATE \`${table}\` SET branding_id = :id WHERE branding_id IS NULL`, {
        replacements: { id: defaultBrandingId },
      });
      await queryInterface.changeColumn(table, 'branding_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'brandings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });
    }

    // roles: unique per tenant
    try {
      await queryInterface.removeIndex('roles', 'name');
    } catch {
      try {
        await queryInterface.removeConstraint('roles', 'name');
      } catch {
        /* index name varies by dialect */
      }
    }
    await queryInterface.addIndex('roles', ['branding_id', 'name'], {
      unique: true,
      name: 'roles_branding_name_uq',
    });

    // clinical_questions: unique code per tenant
    try {
      await queryInterface.removeIndex('clinical_questions', 'code');
    } catch {
      try {
        await queryInterface.removeConstraint('clinical_questions', 'code');
      } catch {
        /* ignore */
      }
    }
    await queryInterface.addIndex('clinical_questions', ['branding_id', 'code'], {
      unique: true,
      name: 'clinical_questions_branding_code_uq',
    });

    await queryInterface.addIndex('users', ['branding_id'], { name: 'users_branding_id_idx' });
    await queryInterface.addIndex('patients', ['branding_id'], { name: 'patients_branding_id_idx' });
    await queryInterface.addIndex('appointments', ['branding_id'], { name: 'appointments_branding_id_idx' });
  },

  async down(queryInterface) {
    const q = queryInterface.sequelize;

    await queryInterface.removeIndex('appointments', 'appointments_branding_id_idx');
    await queryInterface.removeIndex('patients', 'patients_branding_id_idx');
    await queryInterface.removeIndex('users', 'users_branding_id_idx');
    await queryInterface.removeIndex('clinical_questions', 'clinical_questions_branding_code_uq');
    await queryInterface.removeIndex('roles', 'roles_branding_name_uq');

    await queryInterface.addIndex('clinical_questions', ['code'], { unique: true, name: 'code' });
    await queryInterface.addIndex('roles', ['name'], { unique: true, name: 'name' });

    for (const table of [...TABLES].reverse()) {
      await queryInterface.removeColumn(table, 'branding_id');
    }
  },
};
