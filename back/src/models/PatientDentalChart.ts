import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type FranklScale = 'na' | 'I' | 'II' | 'III' | 'IV';
export type DentitionType = 'temporal' | 'mixta' | 'permanente';

export interface PatientDentalChartAttrs {
  id: string;
  patientId: string;
  brandingId: string;
  toothTreatments: Record<string, string>;
  frankl: FranklScale;
  dentition: DentitionType[];
  atm: string;
  ganglios: string;
  softTissues: string;
  frenula: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PatientDentalChartCreationAttrs = Optional<
  PatientDentalChartAttrs,
  'id' | 'toothTreatments' | 'frankl' | 'dentition' | 'atm' | 'ganglios' | 'softTissues' | 'frenula' | 'createdAt' | 'updatedAt'
>;

export class PatientDentalChart
  extends Model<PatientDentalChartAttrs, PatientDentalChartCreationAttrs>
  implements PatientDentalChartAttrs
{
  declare id: string;
  declare patientId: string;
  declare brandingId: string;
  declare toothTreatments: Record<string, string>;
  declare frankl: FranklScale;
  declare dentition: DentitionType[];
  declare atm: string;
  declare ganglios: string;
  declare softTissues: string;
  declare frenula: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PatientDentalChart.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'patient_id' },
    brandingId: { type: DataTypes.UUID, allowNull: false, field: 'branding_id' },
    toothTreatments: { type: DataTypes.JSON, allowNull: false, defaultValue: {}, field: 'tooth_treatments' },
    frankl: {
      type: DataTypes.ENUM('na', 'I', 'II', 'III', 'IV'),
      allowNull: false,
      defaultValue: 'na',
    },
    dentition: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    atm: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    ganglios: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    softTissues: { type: DataTypes.TEXT, allowNull: false, defaultValue: '', field: 'soft_tissues' },
    frenula: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  },
  {
    sequelize,
    modelName: 'PatientDentalChart',
    tableName: 'patient_dental_charts',
  },
);
