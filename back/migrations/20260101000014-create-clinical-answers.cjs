'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clinical_answers', {
      id: { type: Sequelize.UUID, primaryKey: true },
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'patients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      question_code: { type: Sequelize.STRING(80), allowNull: false },
      value: { type: Sequelize.JSON, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('clinical_answers', ['patient_id', 'question_code'], {
      unique: true,
      name: 'clinical_answers_patient_question_uq',
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('clinical_answers');
  },
};
