'use strict';

const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const roles = await queryInterface.sequelize.query(
      "SELECT id, name FROM roles WHERE name IN ('admin', 'doctor')",
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    const adminRole = roles.find((r) => r.name === 'admin');
    const doctorRole = roles.find((r) => r.name === 'doctor');
    if (!adminRole || !doctorRole) {
      throw new Error('Run permissions-roles seeder first');
    }

    const adminId = uuid();
    const doctorId = uuid();

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        email: 'admin@medflow.local',
        password: await bcrypt.hash('Admin123!', 10),
        name: 'Administrador',
        active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: doctorId,
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
