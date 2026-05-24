import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface RoleAttrs {
  id: string;
  brandingId: string;
  name: string;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RoleCreationAttrs = Optional<RoleAttrs, 'id' | 'description' | 'createdAt' | 'updatedAt'>;

export class Role extends Model<RoleAttrs, RoleCreationAttrs> implements RoleAttrs {
  declare id: string;
  declare brandingId: string;
  declare name: string;
  declare description: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  declare Permissions?: any[];
}

Role.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    brandingId: { type: DataTypes.UUID, allowNull: false, field: 'branding_id' },
    name: { type: DataTypes.STRING(60), allowNull: false },
    description: { type: DataTypes.STRING(190), allowNull: true },
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
  },
);
