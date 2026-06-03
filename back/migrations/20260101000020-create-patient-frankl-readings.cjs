'use strict';

const { v4: uuid } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('patient_frankl_readings', {
      id: { type: Sequelize.UUID, primaryKey: true },
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'patients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      branding_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'brandings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      frankl: {
        type: Sequelize.ENUM('I', 'II', 'III', 'IV'),
        allowNull: false,
      },
      recorded_on: { type: Sequelize.DATEONLY, allowNull: false },
      consultation_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'consultations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      appointment_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'appointments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      notes: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('patient_frankl_readings', ['patient_id', 'recorded_on']);
    await queryInterface.addIndex('patient_frankl_readings', ['branding_id', 'recorded_on']);

    const [charts] = await queryInterface.sequelize.query(
      `SELECT patient_id, branding_id, frankl, updated_at
       FROM patient_dental_charts
       WHERE frankl != 'na'`,
    );

    const now = new Date();
    for (const row of charts) {
      const recordedOn = row.updated_at
        ? new Date(row.updated_at).toISOString().slice(0, 10)
        : now.toISOString().slice(0, 10);
      await queryInterface.bulkInsert('patient_frankl_readings', [
        {
          id: uuid(),
          patient_id: row.patient_id,
          branding_id: row.branding_id,
          frankl: row.frankl,
          recorded_on: recordedOn,
          consultation_id: null,
          appointment_id: null,
          notes: '',
          created_at: now,
          updated_at: now,
        },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('patient_frankl_readings');
  },
};
