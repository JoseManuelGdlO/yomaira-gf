import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PrescriptionItemAttrs {
  id: string;
  prescriptionId: string;
  medication: string;
  dose: string;
  frequency: string;
  duration: string;
  position: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PrescriptionItemCreationAttrs = Optional<
  PrescriptionItemAttrs,
  'id' | 'position' | 'createdAt' | 'updatedAt'
>;

export class PrescriptionItem
  extends Model<PrescriptionItemAttrs, PrescriptionItemCreationAttrs>
  implements PrescriptionItemAttrs
{
  declare id: string;
  declare prescriptionId: string;
  declare medication: string;
  declare dose: string;
  declare frequency: string;
  declare duration: string;
  declare position: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PrescriptionItem.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    prescriptionId: { type: DataTypes.UUID, allowNull: false, field: 'prescription_id' },
    medication: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
    dose: { type: DataTypes.STRING(120), allowNull: false, defaultValue: '' },
    frequency: { type: DataTypes.STRING(120), allowNull: false, defaultValue: '' },
    duration: { type: DataTypes.STRING(120), allowNull: false, defaultValue: '' },
    position: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    modelName: 'PrescriptionItem',
    tableName: 'prescription_items',
  },
);
