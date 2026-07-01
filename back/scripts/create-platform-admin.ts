#!/usr/bin/env ts-node
/**
 * Create platform tenant, platform_admin role, and platform admin user.
 *
 * Usage:
 *   npm run platform-admin:create -- --email dev@mediflow.com --password 'Secret123!' --name 'Dev Admin'
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { Op } from 'sequelize';
import { sequelize, Branding, Permission, Role, RolePermission, User, UserRole } from '../src/models';
import { PLATFORM_SLUG } from '../src/services/tenant/tenantManagement';

const PLATFORM_PERMISSIONS = ['tenants.read', 'tenants.write', 'tenants.delete'] as const;

const DEFAULT_BRANDING = {
  clinicName: 'MediFlow Platform',
  doctorName: 'Platform',
  specialty: 'Administración',
  cedula: '',
  email: '',
  phone: '',
  address: '',
  logoEmoji: '⚙️',
  signatureName: 'Platform',
  primary: '0.55 0.25 320',
  secondary: '0.85 0.09 320',
  accent: '0.45 0.13 265',
  surface: '0.985 0.008 320',
  sidebar: '0.99 0.005 320',
  primaryHex: '#B100D4',
  secondaryHex: '#DDB7E8',
  accentHex: '#2D4D8F',
  fontDisplay: 'Fraunces',
  rxFooter: '',
  consentTitle: 'Carta de consentimiento informado',
  consentPoints: null,
  isDefault: false,
  active: true,
};

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function ensurePlatformBranding(): Promise<Branding> {
  let branding = await Branding.findOne({ where: { slug: PLATFORM_SLUG } });
  if (!branding) {
    branding = await Branding.create({
      id: uuid(),
      slug: PLATFORM_SLUG,
      ...DEFAULT_BRANDING,
    });
    console.log(`Created platform branding (${PLATFORM_SLUG})`);
  }
  return branding;
}

async function ensurePlatformAdminRole(brandingId: string): Promise<Role> {
  let role = await Role.findOne({ where: { brandingId, name: 'platform_admin' } });
  if (role) return role;

  const permissions = await Permission.findAll({
    where: { code: { [Op.in]: [...PLATFORM_PERMISSIONS] } },
  });
  if (permissions.length !== PLATFORM_PERMISSIONS.length) {
    throw new Error('Missing tenants.* permissions — run migrations first');
  }

  role = await Role.create({
    id: uuid(),
    brandingId,
    name: 'platform_admin',
    description: 'Platform administrator — manage consultorios only',
  });

  await RolePermission.bulkCreate(
    permissions.map((p) => ({ roleId: role!.id, permissionId: p.id })),
  );
  console.log('Created platform_admin role');
  return role;
}

async function main() {
  const email = arg('email');
  const password = arg('password');
  const name = arg('name') ?? 'Platform Admin';

  if (!email || !password) {
    console.error('Required: --email --password');
    console.error('Optional: --name');
    process.exit(1);
  }

  const branding = await ensurePlatformBranding();
  const role = await ensurePlatformAdminRole(branding.id);

  const normalizedEmail = email.toLowerCase();
  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    console.error(`Email "${email}" already in use`);
    process.exit(1);
  }

  const user = await User.create({
    id: uuid(),
    brandingId: branding.id,
    email: normalizedEmail,
    password: await bcrypt.hash(password, 10),
    name,
    active: true,
  });

  await UserRole.create({ userId: user.id, roleId: role.id });

  const frontend = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  console.log('\nPlatform admin created successfully');
  console.log(`  Email:  ${normalizedEmail}`);
  console.log(`  Login:  ${frontend}/login`);
  console.log(`  Vista:  ${frontend}/consultorios`);

  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
