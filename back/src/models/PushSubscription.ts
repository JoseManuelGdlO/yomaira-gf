import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PushSubscriptionAttrs {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PushSubscriptionCreation = Optional<PushSubscriptionAttrs, 'id' | 'userAgent' | 'createdAt' | 'updatedAt'>;

export class PushSubscription
  extends Model<PushSubscriptionAttrs, PushSubscriptionCreation>
  implements PushSubscriptionAttrs
{
  declare id: string;
  declare userId: string;
  declare endpoint: string;
  declare p256dh: string;
  declare auth: string;
  declare userAgent: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PushSubscription.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    endpoint: { type: DataTypes.STRING(512), allowNull: false },
    p256dh: { type: DataTypes.STRING(255), allowNull: false },
    auth: { type: DataTypes.STRING(255), allowNull: false },
    userAgent: { type: DataTypes.STRING(500), allowNull: true },
  },
  { sequelize, modelName: 'PushSubscription', tableName: 'push_subscriptions' },
);
