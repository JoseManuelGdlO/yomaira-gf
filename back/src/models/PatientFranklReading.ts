import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type FranklReadingScale = 'I' | 'II' | 'III' | 'IV';

export interface PatientFranklReadingAttrs {
  id: string;
  patientId: string;
  brandingId: string;
  frankl: FranklReadingScale;
  recordedOn: string;
  consultationId: string | null;
  appointmentId: string | null;
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PatientFranklReadingCreationAttrs = Optional<
  PatientFranklReadingAttrs,
  'id' | 'consultationId' | 'appointmentId' | 'notes' | 'createdAt' | 'updatedAt'
>;

export class PatientFranklReading
  extends Model<PatientFranklReadingAttrs, PatientFranklReadingCreationAttrs>
  implements PatientFranklReadingAttrs
{
  declare id: string;
  declare patientId: string;
  declare brandingId: string;
  declare frankl: FranklReadingScale;
  declare recordedOn: string;
  declare consultationId: string | null;
  declare appointmentId: string | null;
  declare notes: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PatientFranklReading.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    brandingId: { type: DataTypes.UUID, allowNull: false, field: 'branding_id' },
    frankl: {
      type: DataTypes.ENUM('I', 'II', 'III', 'IV'),
      allowNull: false,
    },
    recordedOn: { type: DataTypes.DATEONLY, allowNull: false, field: 'recorded_on' },
    consultationId: { type: DataTypes.UUID, allowNull: true, field: 'consultation_id' },
    appointmentId: { type: DataTypes.UUID, allowNull: true, field: 'appointment_id' },
    notes: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  },
  {
    sequelize,
    modelName: 'PatientFranklReading',
    tableName: 'patient_frankl_readings',
  },
);
