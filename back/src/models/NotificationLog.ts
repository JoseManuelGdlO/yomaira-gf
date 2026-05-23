import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface NotificationLogAttrs {
  id: string;
  appointmentId: string | null;
  eventType: string;
  channel: string;
  recipient: string;
  status: string;
  errorMessage: string | null;
  createdAt?: Date;
}

export type NotificationLogCreation = Optional<NotificationLogAttrs, 'id' | 'appointmentId' | 'errorMessage' | 'createdAt'>;

export class NotificationLog extends Model<NotificationLogAttrs, NotificationLogCreation> implements NotificationLogAttrs {
  declare id: string;
  declare appointmentId: string | null;
  declare eventType: string;
  declare channel: string;
  declare recipient: string;
  declare status: string;
  declare errorMessage: string | null;
  declare readonly createdAt: Date;
}

NotificationLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    appointmentId: { type: DataTypes.UUID, allowNull: true },
    eventType: { type: DataTypes.STRING(40), allowNull: false },
    channel: { type: DataTypes.STRING(20), allowNull: false },
    recipient: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.STRING(20), allowNull: false },
    errorMessage: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, modelName: 'NotificationLog', tableName: 'notification_logs', updatedAt: false },
);
