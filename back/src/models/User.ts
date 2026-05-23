import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface UserAttrs {
  id: string;
  email: string;
  password: string;
  name: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationAttrs = Optional<UserAttrs, 'id' | 'active' | 'createdAt' | 'updatedAt'>;

export class User extends Model<UserAttrs, UserCreationAttrs> implements UserAttrs {
  declare id: string;
  declare email: string;
  declare password: string;
  declare name: string;
  declare active: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  declare Roles?: any[];
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    name: { type: DataTypes.STRING(190), allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  },
);
