'use strict';

const CODES = [
  'hospitalized',
  'surgery',
  'bottle',
  'formula',
  'breast_milk',
  'pacifier',
  'lip_biting',
  'complementary_feeding',
];

const quotedCodes = CODES.map((code) => `'${code}'`).join(', ');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE clinical_questions
       SET type = 'textarea', updated_at = NOW()
       WHERE code IN (${quotedCodes})
       AND type = 'yes_no'`,
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE clinical_questions
       SET type = 'yes_no', updated_at = NOW()
       WHERE code IN (${quotedCodes})
       AND type = 'textarea'`,
    );
  },
};
