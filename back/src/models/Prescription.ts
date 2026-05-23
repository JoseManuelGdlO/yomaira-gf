import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PrescriptionAttrs {
  id: string;
  patientId: string;
  date: string;
  diagnosis: string;
  indications: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PrescriptionCreationAttrs = Optional<
  PrescriptionAttrs,
  'id' | 'diagnosis' | 'indications' | 'createdAt' | 'updatedAt'
>;

export class Prescription extends Model<PrescriptionAttrs, PrescriptionCreationAttrs> implements PrescriptionAttrs {
  declare id: string;
  declare patientId: string;
  declare date: string;
  declare diagnosis: string;
  declare indications: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  declare items?: any[];
}

Prescription.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    diagnosis: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
    indications: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  },
  {
    sequelize,
    modelName: 'Prescription',
    tableName: 'prescriptions',
  },
);
