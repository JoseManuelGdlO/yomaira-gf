import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface InventoryItemAttrs {
  id: string;
  brandingId: string;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  category: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type InventoryItemCreationAttrs = Optional<
  InventoryItemAttrs,
  'id' | 'unit' | 'quantity' | 'minQuantity' | 'category' | 'active' | 'createdAt' | 'updatedAt'
>;

export class InventoryItem extends Model<InventoryItemAttrs, InventoryItemCreationAttrs> implements InventoryItemAttrs {
  declare id: string;
  declare brandingId: string;
  declare name: string;
  declare unit: string;
  declare quantity: number;
  declare minQuantity: number;
  declare category: string;
  declare active: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

InventoryItem.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    brandingId: { type: DataTypes.UUID, allowNull: false, field: 'branding_id' },
    name: { type: DataTypes.STRING(190), allowNull: false },
    unit: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'unidades' },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    minQuantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 5, field: 'min_quantity' },
    category: { type: DataTypes.STRING(80), allowNull: false, defaultValue: '' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    modelName: 'InventoryItem',
    tableName: 'inventory_items',
  },
);
