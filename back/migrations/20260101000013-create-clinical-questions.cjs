'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clinical_questions', {
      id: { type: Sequelize.UUID, primaryKey: true },
      code: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      section: { type: Sequelize.STRING(120), allowNull: false },
      label: { type: Sequelize.STRING(500), allowNull: false },
      type: {
        type: Sequelize.ENUM('text', 'textarea', 'yes_no', 'checkbox_group'),
        allowNull: false,
        defaultValue: 'text',
      },
      options: { type: Sequelize.JSON, allowNull: true },
      builtin: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      position: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('clinical_questions');
  },
};
