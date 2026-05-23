'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('patients', {
      id: { type: Sequelize.UUID, primaryKey: true },
      name: { type: Sequelize.STRING(190), allowNull: false },
      age: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      birth_date: { type: Sequelize.DATEONLY, allowNull: false },
      gender: { type: Sequelize.ENUM('M', 'F'), allowNull: false },
      guardian: { type: Sequelize.STRING(190), allowNull: false, defaultValue: '' },
      guardian_phone: { type: Sequelize.STRING(60), allowNull: false, defaultValue: '' },
      email: { type: Sequelize.STRING(190), allowNull: false, defaultValue: '' },
      allergies: { type: Sequelize.JSON, allowNull: false },
      conditions: { type: Sequelize.JSON, allowNull: false },
      blood_type: { type: Sequelize.STRING(8), allowNull: false, defaultValue: 'O+' },
      last_visit: { type: Sequelize.DATEONLY, allowNull: false },
      avatar_color: { type: Sequelize.STRING(16), allowNull: false, defaultValue: '#FCE4F5' },
      consent_photo: { type: Sequelize.TEXT('long'), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('patients');
  },
};
