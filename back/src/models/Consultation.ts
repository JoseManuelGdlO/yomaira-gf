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
  nextTreatment: string;
  paymentAndNextAppointment: string;
  evolutionNote: string;
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
  declare nextTreatment: string;
  declare paymentAndNextAppointment: string;
  declare evolutionNote: string;
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
    nextTreatment: { type: DataTypes.TEXT, allowNull: false, defaultValue: '', field: 'next_treatment' },
    paymentAndNextAppointment: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
      field: 'payment_and_next_appointment',
    },
    evolutionNote: { type: DataTypes.TEXT, allowNull: false, defaultValue: '', field: 'evolution_note' },
    doctor: { type: DataTypes.STRING(190), allowNull: false, defaultValue: '' },
  },
  {
    sequelize,
    modelName: 'Consultation',
    tableName: 'consultations',
  },
);
