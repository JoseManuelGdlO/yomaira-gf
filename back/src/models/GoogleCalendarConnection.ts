import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface GoogleCalendarConnectionAttrs {
  id: string;
  userId: string;
  refreshTokenEnc: string;
  calendarId: string;
  connectedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type GoogleCalendarConnectionCreation = Optional<
  GoogleCalendarConnectionAttrs,
  'id' | 'calendarId' | 'createdAt' | 'updatedAt'
>;

export class GoogleCalendarConnection
  extends Model<GoogleCalendarConnectionAttrs, GoogleCalendarConnectionCreation>
  implements GoogleCalendarConnectionAttrs
{
  declare id: string;
  declare userId: string;
  declare refreshTokenEnc: string;
  declare calendarId: string;
  declare connectedAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

GoogleCalendarConnection.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    refreshTokenEnc: { type: DataTypes.TEXT, allowNull: false },
    calendarId: { type: DataTypes.STRING(255), allowNull: false, defaultValue: 'primary' },
    connectedAt: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, modelName: 'GoogleCalendarConnection', tableName: 'google_calendar_connections' },
);
