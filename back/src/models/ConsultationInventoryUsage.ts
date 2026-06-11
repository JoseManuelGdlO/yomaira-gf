import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ConsultationInventoryUsageAttrs {
  id: string;
  consultationId: string;
  inventoryItemId: string;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ConsultationInventoryUsageCreationAttrs = Optional<
  ConsultationInventoryUsageAttrs,
  'id' | 'createdAt' | 'updatedAt'
>;

export class ConsultationInventoryUsage
  extends Model<ConsultationInventoryUsageAttrs, ConsultationInventoryUsageCreationAttrs>
  implements ConsultationInventoryUsageAttrs
{
  declare id: string;
  declare consultationId: string;
  declare inventoryItemId: string;
  declare quantity: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ConsultationInventoryUsage.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    consultationId: { type: DataTypes.UUID, allowNull: false, field: 'consultation_id' },
    inventoryItemId: { type: DataTypes.UUID, allowNull: false, field: 'inventory_item_id' },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  {
    sequelize,
    modelName: 'ConsultationInventoryUsage',
    tableName: 'consultation_inventory_usages',
  },
);
