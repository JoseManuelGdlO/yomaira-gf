import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface AppointmentCalendarEventAttrs {
  id: string;
  appointmentId: string;
  userId: string;
  googleEventId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AppointmentCalendarEventCreation = Optional<
  AppointmentCalendarEventAttrs,
  'id' | 'createdAt' | 'updatedAt'
>;

export class AppointmentCalendarEvent
  extends Model<AppointmentCalendarEventAttrs, AppointmentCalendarEventCreation>
  implements AppointmentCalendarEventAttrs
{
  declare id: string;
  declare appointmentId: string;
  declare userId: string;
  declare googleEventId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AppointmentCalendarEvent.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    appointmentId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    googleEventId: { type: DataTypes.STRING(255), allowNull: false },
  },
  { sequelize, modelName: 'AppointmentCalendarEvent', tableName: 'appointment_calendar_events' },
);
