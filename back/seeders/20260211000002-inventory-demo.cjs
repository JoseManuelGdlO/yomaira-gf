'use strict';

const { v4: uuid } = require('uuid');

const DEMO_ITEMS = [
  { name: 'Resina compuesta A2', unit: 'jeringas', quantity: 8, min_quantity: 3, category: 'material' },
  { name: 'Anestesia lidocaína 2%', unit: 'carpules', quantity: 2, min_quantity: 5, category: 'anestesia' },
  { name: 'Guantes de látex (caja)', unit: 'cajas', quantity: 4, min_quantity: 2, category: 'protección' },
  { name: 'Mascarillas quirúrgicas', unit: 'cajas', quantity: 1, min_quantity: 2, category: 'protección' },
  { name: 'Algodón', unit: 'bolsas', quantity: 6, min_quantity: 3, category: 'material' },
  { name: 'Puntas de alta velocidad', unit: 'unidades', quantity: 12, min_quantity: 5, category: 'material' },
  { name: 'Fresas diamantadas', unit: 'unidades', quantity: 3, min_quantity: 4, category: 'material' },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const q = queryInterface.sequelize;
    const brandings = await q.query('SELECT id FROM brandings', { type: q.QueryTypes.SELECT });

    for (const branding of brandings) {
      const [existing] = await q.query(
        'SELECT id FROM inventory_items WHERE branding_id = :brandingId LIMIT 1',
        { replacements: { brandingId: branding.id }, type: q.QueryTypes.SELECT },
      );
      if (existing) continue;

      await queryInterface.bulkInsert(
        'inventory_items',
        DEMO_ITEMS.map((item) => ({
          id: uuid(),
          branding_id: branding.id,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          min_quantity: item.min_quantity,
          category: item.category,
          active: true,
          created_at: now,
          updated_at: now,
        })),
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('inventory_items', null, {});
  },
};
