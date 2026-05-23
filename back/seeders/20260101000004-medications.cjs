'use strict';

const { v4: uuid } = require('uuid');

const ITEMS = [
  ['Amoxicilina', 'Suspensión 250mg/5ml'],
  ['Ibuprofeno', 'Suspensión 100mg/5ml'],
  ['Paracetamol', 'Suspensión 120mg/5ml'],
  ['Clorhexidina', 'Enjuague 0.12%'],
  ['Nistatina', 'Suspensión oral 100,000 UI/ml'],
  ['Naproxeno', 'Suspensión 125mg/5ml'],
  ['Fluoruro de sodio', 'Gel 1.1%'],
  ['Lidocaína tópica', 'Gel 2%'],
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'medications',
      ITEMS.map(([name, presentation]) => ({
        id: uuid(),
        name,
        presentation,
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('medications', null, {});
  },
};
