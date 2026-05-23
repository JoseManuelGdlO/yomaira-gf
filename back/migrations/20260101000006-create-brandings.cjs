'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('brandings', {
      id: { type: Sequelize.UUID, primaryKey: true },
      slug: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      clinic_name: { type: Sequelize.STRING(190), allowNull: false },
      doctor_name: { type: Sequelize.STRING(190), allowNull: false },
      specialty: { type: Sequelize.STRING(120), allowNull: false, defaultValue: '' },
      cedula: { type: Sequelize.STRING(60), allowNull: false, defaultValue: '' },
      email: { type: Sequelize.STRING(190), allowNull: false, defaultValue: '' },
      phone: { type: Sequelize.STRING(60), allowNull: false, defaultValue: '' },
      address: { type: Sequelize.STRING(255), allowNull: false, defaultValue: '' },
      logo_emoji: { type: Sequelize.STRING(8), allowNull: false, defaultValue: '🩺' },
      signature_name: { type: Sequelize.STRING(190), allowNull: false, defaultValue: '' },
      primary: { type: Sequelize.STRING(60), allowNull: false },
      secondary: { type: Sequelize.STRING(60), allowNull: false },
      accent: { type: Sequelize.STRING(60), allowNull: false },
      surface: { type: Sequelize.STRING(60), allowNull: false },
      sidebar: { type: Sequelize.STRING(60), allowNull: false },
      primary_hex: { type: Sequelize.STRING(16), allowNull: false },
      secondary_hex: { type: Sequelize.STRING(16), allowNull: false },
      accent_hex: { type: Sequelize.STRING(16), allowNull: false },
      font_display: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'Fraunces' },
      rx_footer: { type: Sequelize.TEXT, allowNull: false },
      is_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('brandings');
  },
};
