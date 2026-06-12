import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';

export interface FinanceChargeAttrs {
  id: string;
  brandingId: string;
  consultationId: string | null;
  patientId: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  note: string;
  createdBy: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type FinanceChargeCreationAttrs = Optional<
  FinanceChargeAttrs,
  'id' | 'consultationId' | 'note' | 'createdBy' | 'createdAt' | 'updatedAt'
>;

export class FinanceCharge
  extends Model<FinanceChargeAttrs, FinanceChargeCreationAttrs>
  implements FinanceChargeAttrs
{
  declare id: string;
  declare brandingId: string;
  declare consultationId: string | null;
  declare patientId: string;
  declare date: string;
  declare amount: number;
  declare paymentMethod: PaymentMethod;
  declare note: string;
  declare createdBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

FinanceCharge.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    brandingId: { type: DataTypes.UUID, allowNull: false, field: 'branding_id' },
    consultationId: { type: DataTypes.UUID, allowNull: true, field: 'consultation_id' },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    paymentMethod: {
      type: DataTypes.ENUM('efectivo', 'tarjeta', 'transferencia', 'otro'),
      allowNull: false,
      defaultValue: 'efectivo',
      field: 'payment_method',
    },
    note: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  },
  {
    sequelize,
    modelName: 'FinanceCharge',
    tableName: 'finance_charges',
  },
);
