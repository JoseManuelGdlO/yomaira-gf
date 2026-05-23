'use strict';

async function cleanupPartial(queryInterface) {
  const q = queryInterface.sequelize;
  await q.query('DROP TABLE IF EXISTS notification_logs');
  await q.query('DROP TABLE IF EXISTS appointment_calendar_events');
  await q.query('DROP TABLE IF EXISTS google_calendar_connections');
  await q.query('DROP TABLE IF EXISTS push_subscriptions');
  await q.query('DROP TABLE IF EXISTS notification_preferences');
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await cleanupPartial(queryInterface);

    await queryInterface.createTable('notification_preferences', {
      id: { type: Sequelize.UUID, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      email_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      push_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      on_appointment_created: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      on_appointment_confirmed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      on_appointment_cancelled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('push_subscriptions', {
      id: { type: Sequelize.UUID, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      endpoint: { type: Sequelize.STRING(512), allowNull: false },
      p256dh: { type: Sequelize.STRING(255), allowNull: false },
      auth: { type: Sequelize.STRING(255), allowNull: false },
      user_agent: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('push_subscriptions', ['user_id', 'endpoint'], {
      unique: true,
      name: 'push_subscriptions_user_endpoint_uq',
    });

    await queryInterface.createTable('google_calendar_connections', {
      id: { type: Sequelize.UUID, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      refresh_token_enc: { type: Sequelize.TEXT, allowNull: false },
      calendar_id: { type: Sequelize.STRING(255), allowNull: false, defaultValue: 'primary' },
      connected_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('appointment_calendar_events', {
      id: { type: Sequelize.UUID, primaryKey: true },
      appointment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'appointments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      google_event_id: { type: Sequelize.STRING(255), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('appointment_calendar_events', ['appointment_id', 'user_id'], {
      unique: true,
      name: 'appt_calendar_events_appt_user_uq',
    });

    await queryInterface.createTable('notification_logs', {
      id: { type: Sequelize.UUID, primaryKey: true },
      appointment_id: { type: Sequelize.UUID, allowNull: true },
      event_type: { type: Sequelize.STRING(40), allowNull: false },
      channel: { type: Sequelize.STRING(20), allowNull: false },
      recipient: { type: Sequelize.STRING(255), allowNull: false },
      status: { type: Sequelize.STRING(20), allowNull: false },
      error_message: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });

    const tableInfo = await queryInterface.describeTable('appointments');
    if (!tableInfo.scheduled_by) {
      await queryInterface.addColumn('appointments', 'scheduled_by', {
        type: Sequelize.ENUM('staff', 'patient'),
        allowNull: false,
        defaultValue: 'staff',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('appointments', 'scheduled_by');
    await queryInterface.dropTable('notification_logs');
    await queryInterface.dropTable('appointment_calendar_events');
    await queryInterface.dropTable('google_calendar_connections');
    await queryInterface.dropTable('push_subscriptions');
    await queryInterface.dropTable('notification_preferences');
  },
};
