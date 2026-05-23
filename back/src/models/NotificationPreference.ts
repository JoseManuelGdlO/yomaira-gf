import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface NotificationPreferenceAttrs {
  id: string;
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  onAppointmentCreated: boolean;
  onAppointmentConfirmed: boolean;
  onAppointmentCancelled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type NotificationPreferenceCreation = Optional<
  NotificationPreferenceAttrs,
  'id' | 'emailEnabled' | 'pushEnabled' | 'onAppointmentCreated' | 'onAppointmentConfirmed' | 'onAppointmentCancelled' | 'createdAt' | 'updatedAt'
>;

export class NotificationPreference
  extends Model<NotificationPreferenceAttrs, NotificationPreferenceCreation>
  implements NotificationPreferenceAttrs
{
  declare id: string;
  declare userId: string;
  declare emailEnabled: boolean;
  declare pushEnabled: boolean;
  declare onAppointmentCreated: boolean;
  declare onAppointmentConfirmed: boolean;
  declare onAppointmentCancelled: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

NotificationPreference.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    emailEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    pushEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    onAppointmentCreated: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    onAppointmentConfirmed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    onAppointmentCancelled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, modelName: 'NotificationPreference', tableName: 'notification_preferences' },
);
