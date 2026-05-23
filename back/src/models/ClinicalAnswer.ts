import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ClinicalAnswerAttrs {
  id: string;
  patientId: string;
  questionCode: string;
  value: string | string[] | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ClinicalAnswerCreationAttrs = Optional<ClinicalAnswerAttrs, 'id' | 'createdAt' | 'updatedAt'>;

export class ClinicalAnswer
  extends Model<ClinicalAnswerAttrs, ClinicalAnswerCreationAttrs>
  implements ClinicalAnswerAttrs
{
  declare id: string;
  declare patientId: string;
  declare questionCode: string;
  declare value: string | string[] | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ClinicalAnswer.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    questionCode: { type: DataTypes.STRING(80), allowNull: false, field: 'question_code' },
    value: { type: DataTypes.JSON, allowNull: true },
  },
  {
    sequelize,
    modelName: 'ClinicalAnswer',
    tableName: 'clinical_answers',
    indexes: [{ unique: true, fields: ['patient_id', 'question_code'] }],
  },
);
