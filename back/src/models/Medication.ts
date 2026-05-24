import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface MedicationAttrs {
  id: string;
  brandingId: string;
  name: string;
  presentation: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MedicationCreationAttrs = Optional<MedicationAttrs, 'id' | 'createdAt' | 'updatedAt'>;

export class Medication extends Model<MedicationAttrs, MedicationCreationAttrs> implements MedicationAttrs {
  declare id: string;
  declare brandingId: string;
  declare name: string;
  declare presentation: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Medication.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    brandingId: { type: DataTypes.UUID, allowNull: false, field: 'branding_id' },
    name: { type: DataTypes.STRING(190), allowNull: false },
    presentation: { type: DataTypes.STRING(190), allowNull: false, defaultValue: '' },
  },
  {
    sequelize,
    modelName: 'Medication',
    tableName: 'medications',
  },
);
