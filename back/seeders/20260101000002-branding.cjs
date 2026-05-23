'use strict';

const { v4: uuid } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('brandings', [
      {
        id: uuid(),
        slug: 'yomaira',
        clinic_name: 'Smile Kids Dental',
        doctor_name: 'C.D.E.O. Yomaira García Flores',
        specialty: 'Odontopediatría',
        cedula: '12345678',
        email: 'contacto@smilekids.mx',
        phone: '+52 55 1234 5678',
        address: 'Av. Reforma 123, Col. Centro, CDMX',
        logo_emoji: '🦷',
        signature_name: 'Dra. Yomaira García',
        primary: '0.55 0.25 320',
        secondary: '0.85 0.09 320',
        accent: '0.45 0.13 265',
        surface: '0.985 0.008 320',
        sidebar: '0.99 0.005 320',
        primary_hex: '#B100D4',
        secondary_hex: '#DDB7E8',
        accent_hex: '#2D4D8F',
        font_display: 'Fraunces',
        rx_footer:
          'Sonríe, juega, crece. Cuidamos tu sonrisa desde la primera dentición.',
        is_default: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('brandings', null, {});
  },
};
