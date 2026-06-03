import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PatientAttrs {
  id: string;
  brandingId: string;
  name: string;
  age: number;
  birthDate: string;
  gender: 'M' | 'F';
  guardian: string;
  guardianPhone: string;
  email: string;
  allergies: string[];
  conditions: string[];
  bloodType: string;
  weightKg: number | null;
  lastVisit: string;
  avatarColor: string;
  consentPhoto: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PatientCreationAttrs = Optional<
  PatientAttrs,
  'id' | 'allergies' | 'conditions' | 'weightKg' | 'consentPhoto' | 'createdAt' | 'updatedAt'
>;

export class Patient extends Model<PatientAttrs, PatientCreationAttrs> implements PatientAttrs {
  declare id: string;
  declare brandingId: string;
  declare name: string;
  declare age: number;
  declare birthDate: string;
  declare gender: 'M' | 'F';
  declare guardian: string;
  declare guardianPhone: string;
  declare email: string;
  declare allergies: string[];
  declare conditions: string[];
  declare bloodType: string;
  declare weightKg: number | null;
  declare lastVisit: string;
  declare avatarColor: string;
  declare consentPhoto: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Patient.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    brandingId: { type: DataTypes.UUID, allowNull: false, field: 'branding_id' },
    name: { type: DataTypes.STRING(190), allowNull: false },
    age: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    birthDate: { type: DataTypes.DATEONLY, allowNull: false },
    gender: { type: DataTypes.ENUM('M', 'F'), allowNull: false },
    guardian: { type: DataTypes.STRING(190), allowNull: false, defaultValue: '' },
    guardianPhone: { type: DataTypes.STRING(60), allowNull: false, defaultValue: '' },
    email: { type: DataTypes.STRING(190), allowNull: false, defaultValue: '' },
    allergies: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    conditions: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    bloodType: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'O+' },
    weightKg: { type: DataTypes.DECIMAL(5, 2), allowNull: true, field: 'weight_kg' },
    lastVisit: { type: DataTypes.DATEONLY, allowNull: false },
    avatarColor: { type: DataTypes.STRING(16), allowNull: false, defaultValue: '#FCE4F5' },
    consentPhoto: { type: DataTypes.TEXT('long'), allowNull: true },
  },
  {
    sequelize,
    modelName: 'Patient',
    tableName: 'patients',
  },
);
