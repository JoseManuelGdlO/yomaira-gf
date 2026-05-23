import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type QuestionType = 'text' | 'textarea' | 'yes_no' | 'checkbox_group';

export interface ClinicalQuestionAttrs {
  id: string;
  code: string;
  section: string;
  label: string;
  type: QuestionType;
  options: string[] | null;
  builtin: boolean;
  position: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ClinicalQuestionCreationAttrs = Optional<
  ClinicalQuestionAttrs,
  'id' | 'options' | 'builtin' | 'position' | 'createdAt' | 'updatedAt'
>;

export class ClinicalQuestion
  extends Model<ClinicalQuestionAttrs, ClinicalQuestionCreationAttrs>
  implements ClinicalQuestionAttrs
{
  declare id: string;
  declare code: string;
  declare section: string;
  declare label: string;
  declare type: QuestionType;
  declare options: string[] | null;
  declare builtin: boolean;
  declare position: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ClinicalQuestion.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING(80), allowNull: false },
    section: { type: DataTypes.STRING(120), allowNull: false },
    label: { type: DataTypes.STRING(500), allowNull: false },
    type: {
      type: DataTypes.ENUM('text', 'textarea', 'yes_no', 'checkbox_group'),
      allowNull: false,
      defaultValue: 'text',
    },
    options: { type: DataTypes.JSON, allowNull: true },
    builtin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    position: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    modelName: 'ClinicalQuestion',
    tableName: 'clinical_questions',
  },
);
