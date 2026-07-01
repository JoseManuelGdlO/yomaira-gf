import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { Op } from 'sequelize';
import { Branding, Role, User, UserRole } from '../../models';
import { seedTenantRoles } from './seedTenantRoles';
import { Conflict, NotFound } from '../../utils/errors';

export const PLATFORM_SLUG = 'platform';

const DEFAULT_BRANDING_COLORS = {
  primary: '0.55 0.25 320',
  secondary: '0.85 0.09 320',
  accent: '0.45 0.13 265',
  surface: '0.985 0.008 320',
  sidebar: '0.99 0.005 320',
  primaryHex: '#B100D4',
  secondaryHex: '#DDB7E8',
  accentHex: '#2D4D8F',
  fontDisplay: 'Fraunces',
  logoEmoji: '🩺',
};

export type CreateTenantInput = {
  slug: string;
  clinicName: string;
  doctorName: string;
  specialty?: string;
  adminEmail: string;
  adminPassword: string;
};

export type UpdateTenantInput = {
  clinicName?: string;
  doctorName?: string;
  specialty?: string;
  email?: string;
  adminPassword?: string;
};

export type TenantListItem = {
  id: string;
  slug: string;
  clinicName: string;
  doctorName: string;
  specialty: string;
  email: string;
  active: boolean;
  adminEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
};

async function findAdminEmail(brandingId: string): Promise<string | null> {
  const adminRole = await Role.findOne({ where: { brandingId, name: 'admin' } });
  if (!adminRole) return null;

  const userRole = await UserRole.findOne({
    where: { roleId: adminRole.id },
    include: [{ model: User, as: 'user', required: true, where: { brandingId } }],
  });
  const user = userRole?.get('user') as User | undefined;
  return user?.email ?? null;
}

function serializeTenant(branding: Branding, adminEmail: string | null): TenantListItem {
  return {
    id: branding.id,
    slug: branding.slug,
    clinicName: branding.clinicName,
    doctorName: branding.doctorName,
    specialty: branding.specialty,
    email: branding.email,
    active: branding.active,
    adminEmail,
    createdAt: branding.createdAt,
    updatedAt: branding.updatedAt,
  };
}

export async function listTenants(): Promise<TenantListItem[]> {
  const brandings = await Branding.findAll({
    where: { slug: { [Op.ne]: PLATFORM_SLUG } },
    order: [['createdAt', 'DESC']],
  });

  return Promise.all(
    brandings.map(async (b) => serializeTenant(b, await findAdminEmail(b.id))),
  );
}

export async function getTenant(id: string): Promise<TenantListItem> {
  const branding = await Branding.findByPk(id);
  if (!branding || branding.slug === PLATFORM_SLUG) throw NotFound('Consultorio not found');
  return serializeTenant(branding, await findAdminEmail(branding.id));
}

export async function createTenant(input: CreateTenantInput): Promise<TenantListItem> {
  const slug = input.slug.trim().toLowerCase();
  const adminEmail = input.adminEmail.trim().toLowerCase();
  const specialty = input.specialty?.trim() || 'Medicina general';

  if (slug === PLATFORM_SLUG) {
    throw Conflict('Slug reserved for platform');
  }

  const exists = await Branding.findOne({ where: { slug } });
  if (exists) throw Conflict(`Branding slug "${slug}" already exists`);

  const emailTaken = await User.findOne({ where: { email: adminEmail } });
  if (emailTaken) throw Conflict(`Email "${adminEmail}" already in use`);

  const branding = await Branding.create({
    id: uuid(),
    slug,
    clinicName: input.clinicName.trim(),
    doctorName: input.doctorName.trim(),
    specialty,
    cedula: '',
    email: adminEmail,
    phone: '',
    address: '',
    logoEmoji: DEFAULT_BRANDING_COLORS.logoEmoji,
    signatureName: input.doctorName.trim(),
    primary: DEFAULT_BRANDING_COLORS.primary,
    secondary: DEFAULT_BRANDING_COLORS.secondary,
    accent: DEFAULT_BRANDING_COLORS.accent,
    surface: DEFAULT_BRANDING_COLORS.surface,
    sidebar: DEFAULT_BRANDING_COLORS.sidebar,
    primaryHex: DEFAULT_BRANDING_COLORS.primaryHex,
    secondaryHex: DEFAULT_BRANDING_COLORS.secondaryHex,
    accentHex: DEFAULT_BRANDING_COLORS.accentHex,
    fontDisplay: DEFAULT_BRANDING_COLORS.fontDisplay,
    rxFooter: '',
    consentTitle: 'Carta de consentimiento informado',
    consentPoints: null,
    isDefault: false,
    active: true,
  });

  const roleByName = await seedTenantRoles(branding.id);
  const adminRoleId = roleByName.admin;
  if (!adminRoleId) throw new Error('Failed to create admin role');

  const admin = await User.create({
    id: uuid(),
    brandingId: branding.id,
    email: adminEmail,
    password: await bcrypt.hash(input.adminPassword, 10),
    name: `Admin ${input.clinicName.trim()}`,
    active: true,
  });

  await UserRole.create({ userId: admin.id, roleId: adminRoleId });

  return serializeTenant(branding, adminEmail);
}

export async function updateTenant(id: string, input: UpdateTenantInput): Promise<TenantListItem> {
  const branding = await Branding.findByPk(id);
  if (!branding || branding.slug === PLATFORM_SLUG) throw NotFound('Consultorio not found');

  if (input.clinicName !== undefined) branding.clinicName = input.clinicName.trim();
  if (input.doctorName !== undefined) {
    branding.doctorName = input.doctorName.trim();
    branding.signatureName = input.doctorName.trim();
  }
  if (input.specialty !== undefined) branding.specialty = input.specialty.trim();
  if (input.email !== undefined) branding.email = input.email.trim();

  await branding.save();

  if (input.adminPassword) {
    const adminRole = await Role.findOne({ where: { brandingId: id, name: 'admin' } });
    if (adminRole) {
      const userRole = await UserRole.findOne({ where: { roleId: adminRole.id } });
      if (userRole) {
        const admin = await User.findByPk(userRole.userId);
        if (admin) {
          admin.password = await bcrypt.hash(input.adminPassword, 10);
          await admin.save();
        }
      }
    }
  }

  return serializeTenant(branding, await findAdminEmail(branding.id));
}

export async function deactivateTenant(id: string): Promise<TenantListItem> {
  const branding = await Branding.findByPk(id);
  if (!branding || branding.slug === PLATFORM_SLUG) throw NotFound('Consultorio not found');
  if (!branding.active) return serializeTenant(branding, await findAdminEmail(branding.id));

  branding.active = false;
  await branding.save();
  await User.update({ active: false }, { where: { brandingId: id } });

  return serializeTenant(branding, await findAdminEmail(branding.id));
}
