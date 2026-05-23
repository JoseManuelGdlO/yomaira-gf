import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type ConsentPointJson = {
  id: string;
  text: string;
  subPoints?: string[];
  note?: string;
  italic?: boolean;
};

export interface BrandingAttrs {
  id: string;
  slug: string;
  clinicName: string;
  doctorName: string;
  specialty: string;
  cedula: string;
  email: string;
  phone: string;
  address: string;
  logoEmoji: string;
  signatureName: string;
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  sidebar: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  fontDisplay: string;
  rxFooter: string;
  consentTitle: string;
  consentPoints: ConsentPointJson[] | null;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BrandingCreationAttrs = Optional<
  BrandingAttrs,
  'id' | 'isDefault' | 'createdAt' | 'updatedAt'
>;

export class Branding extends Model<BrandingAttrs, BrandingCreationAttrs> implements BrandingAttrs {
  declare id: string;
  declare slug: string;
  declare clinicName: string;
  declare doctorName: string;
  declare specialty: string;
  declare cedula: string;
  declare email: string;
  declare phone: string;
  declare address: string;
  declare logoEmoji: string;
  declare signatureName: string;
  declare primary: string;
  declare secondary: string;
  declare accent: string;
  declare surface: string;
  declare sidebar: string;
  declare primaryHex: string;
  declare secondaryHex: string;
  declare accentHex: string;
  declare fontDisplay: string;
  declare rxFooter: string;
  declare consentTitle: string;
  declare consentPoints: ConsentPointJson[] | null;
  declare isDefault: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Branding.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    slug: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    clinicName: { type: DataTypes.STRING(190), allowNull: false, field: 'clinic_name' },
    doctorName: { type: DataTypes.STRING(190), allowNull: false, field: 'doctor_name' },
    specialty: { type: DataTypes.STRING(120), allowNull: false, defaultValue: '' },
    cedula: { type: DataTypes.STRING(60), allowNull: false, defaultValue: '' },
    email: { type: DataTypes.STRING(190), allowNull: false, defaultValue: '' },
    phone: { type: DataTypes.STRING(60), allowNull: false, defaultValue: '' },
    address: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
    logoEmoji: { type: DataTypes.STRING(8), allowNull: false, defaultValue: '🩺', field: 'logo_emoji' },
    signatureName: { type: DataTypes.STRING(190), allowNull: false, defaultValue: '', field: 'signature_name' },
    primary: { type: DataTypes.STRING(60), allowNull: false },
    secondary: { type: DataTypes.STRING(60), allowNull: false },
    accent: { type: DataTypes.STRING(60), allowNull: false },
    surface: { type: DataTypes.STRING(60), allowNull: false },
    sidebar: { type: DataTypes.STRING(60), allowNull: false },
    primaryHex: { type: DataTypes.STRING(16), allowNull: false, field: 'primary_hex' },
    secondaryHex: { type: DataTypes.STRING(16), allowNull: false, field: 'secondary_hex' },
    accentHex: { type: DataTypes.STRING(16), allowNull: false, field: 'accent_hex' },
    fontDisplay: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'Fraunces', field: 'font_display' },
    rxFooter: { type: DataTypes.TEXT, allowNull: false, defaultValue: '', field: 'rx_footer' },
    consentTitle: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: 'Carta de consentimiento informado',
      field: 'consent_title',
    },
    consentPoints: { type: DataTypes.JSON, allowNull: true, field: 'consent_points' },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_default' },
  },
  {
    sequelize,
    modelName: 'Branding',
    tableName: 'brandings',
  },
);
