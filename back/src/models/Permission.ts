import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PermissionAttrs {
  id: string;
  code: string;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PermissionCreationAttrs = Optional<PermissionAttrs, 'id' | 'description' | 'createdAt' | 'updatedAt'>;

export class Permission extends Model<PermissionAttrs, PermissionCreationAttrs> implements PermissionAttrs {
  declare id: string;
  declare code: string;
  declare description: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Permission.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(190), allowNull: true },
  },
  {
    sequelize,
    modelName: 'Permission',
    tableName: 'permissions',
  },
);
