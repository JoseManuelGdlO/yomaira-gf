import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface FinanceExpenseAttrs {
  id: string;
  brandingId: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  createdBy: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type FinanceExpenseCreationAttrs = Optional<
  FinanceExpenseAttrs,
  'id' | 'category' | 'description' | 'createdBy' | 'createdAt' | 'updatedAt'
>;

export class FinanceExpense
  extends Model<FinanceExpenseAttrs, FinanceExpenseCreationAttrs>
  implements FinanceExpenseAttrs
{
  declare id: string;
  declare brandingId: string;
  declare date: string;
  declare amount: number;
  declare category: string;
  declare description: string;
  declare createdBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

FinanceExpense.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    brandingId: { type: DataTypes.UUID, allowNull: false, field: 'branding_id' },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    category: { type: DataTypes.STRING(80), allowNull: false, defaultValue: '' },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  },
  {
    sequelize,
    modelName: 'FinanceExpense',
    tableName: 'finance_expenses',
  },
);
