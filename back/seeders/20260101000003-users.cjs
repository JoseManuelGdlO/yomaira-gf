'use strict';

const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const brandings = await queryInterface.sequelize.query(
      "SELECT id FROM brandings WHERE slug = 'yomaira' LIMIT 1",
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    const branding = brandings[0];
    if (!branding) throw new Error('Run branding seeder first');

    const roles = await queryInterface.sequelize.query(
      "SELECT id, name FROM roles WHERE branding_id = :brandingId AND name IN ('admin', 'doctor')",
      {
        type: queryInterface.sequelize.QueryTypes.SELECT,
        replacements: { brandingId: branding.id },
      },
    );
    const adminRole = roles.find((r) => r.name === 'admin');
    const doctorRole = roles.find((r) => r.name === 'doctor');
    if (!adminRole || !doctorRole) {
      throw new Error('Run tenant-roles seeder first');
    }

    const adminId = uuid();
    const doctorId = uuid();

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        branding_id: branding.id,
        email: 'admin@medflow.local',
        password: await bcrypt.hash('Admin123!', 10),
        name: 'Administrador',
        active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: doctorId,
        branding_id: branding.id,
        email: 'doctor@medflow.local',
        password: await bcrypt.hash('Doctor123!', 10),
        name: 'Dra. Yomaira García',
        active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('user_roles', [
      { user_id: adminId, role_id: adminRole.id, created_at: now, updated_at: now },
      { user_id: doctorId, role_id: doctorRole.id, created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('user_roles', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
