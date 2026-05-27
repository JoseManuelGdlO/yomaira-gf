import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type BudgetItem = {
  description: string;
  tooth?: string;
  amount: number;
};

export interface TreatmentBudgetAttrs {
  id: string;
  patientId: string;
  brandingId: string;
  status: 'active' | 'superseded';
  items: BudgetItem[];
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TreatmentBudgetCreationAttrs = Optional<
  TreatmentBudgetAttrs,
  'id' | 'status' | 'items' | 'notes' | 'createdAt' | 'updatedAt'
>;

export class TreatmentBudget
  extends Model<TreatmentBudgetAttrs, TreatmentBudgetCreationAttrs>
  implements TreatmentBudgetAttrs
{
  declare id: string;
  declare patientId: string;
  declare brandingId: string;
  declare status: 'active' | 'superseded';
  declare items: BudgetItem[];
  declare notes: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TreatmentBudget.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    brandingId: { type: DataTypes.UUID, allowNull: false, field: 'branding_id' },
    status: {
      type: DataTypes.ENUM('active', 'superseded'),
      allowNull: false,
      defaultValue: 'active',
    },
    items: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    notes: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  },
  {
    sequelize,
    modelName: 'TreatmentBudget',
    tableName: 'treatment_budgets',
  },
);
