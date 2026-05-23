import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ConsultationAttrs {
  id: string;
  patientId: string;
  date: string;
  reason: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  doctor: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ConsultationCreationAttrs = Optional<ConsultationAttrs, 'id' | 'createdAt' | 'updatedAt'>;

export class Consultation extends Model<ConsultationAttrs, ConsultationCreationAttrs> implements ConsultationAttrs {
  declare id: string;
  declare patientId: string;
  declare date: string;
  declare reason: string;
  declare diagnosis: string;
  declare treatment: string;
  declare notes: string;
  declare doctor: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Consultation.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    reason: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
    diagnosis: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    treatment: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    notes: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    doctor: { type: DataTypes.STRING(190), allowNull: false, defaultValue: '' },
  },
  {
    sequelize,
    modelName: 'Consultation',
    tableName: 'consultations',
  },
);
