import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class UserRole extends Model {
  declare userId: string;
  declare roleId: string;
}

UserRole.init(
  {
    userId: { type: DataTypes.UUID, allowNull: false, primaryKey: true, field: 'user_id' },
    roleId: { type: DataTypes.UUID, allowNull: false, primaryKey: true, field: 'role_id' },
  },
  {
    sequelize,
    modelName: 'UserRole',
    tableName: 'user_roles',
    timestamps: true,
  },
);
