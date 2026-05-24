import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
export type AppointmentScheduledBy = 'staff' | 'patient';

export interface AppointmentAttrs {
  id: string;
  brandingId: string;
  patientId: string;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
  scheduledBy: AppointmentScheduledBy;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AppointmentCreationAttrs = Optional<AppointmentAttrs, 'id' | 'status' | 'scheduledBy' | 'createdAt' | 'updatedAt'>;

export class Appointment extends Model<AppointmentAttrs, AppointmentCreationAttrs> implements AppointmentAttrs {
  declare id: string;
  declare brandingId: string;
  declare patientId: string;
  declare date: string;
  declare time: string;
  declare reason: string;
  declare status: AppointmentStatus;
  declare scheduledBy: AppointmentScheduledBy;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Appointment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    brandingId: { type: DataTypes.UUID, allowNull: false, field: 'branding_id' },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    time: { type: DataTypes.STRING(8), allowNull: false },
    reason: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
    status: {
      type: DataTypes.ENUM('pendiente', 'confirmada', 'completada', 'cancelada'),
      allowNull: false,
      defaultValue: 'pendiente',
    },
    scheduledBy: {
      type: DataTypes.ENUM('staff', 'patient'),
      allowNull: false,
      defaultValue: 'staff',
    },
  },
  {
    sequelize,
    modelName: 'Appointment',
    tableName: 'appointments',
  },
);
