#!/usr/bin/env ts-node
/**
 * Create a new consultorio (tenant) with default roles and admin user.
 *
 * Usage:
 *   npm run tenant:create -- --slug drgarcia --clinic "Consultorio Dr. García" \
 *     --doctor "Dr. García" --admin-email admin@drgarcia.com --admin-password 'Secret123!'
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { sequelize, Branding, User, UserRole } from '../src/models';
import { seedTenantRoles } from '../src/services/tenant/seedTenantRoles';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  const slug = arg('slug');
  const clinic = arg('clinic');
  const doctor = arg('doctor');
  const adminEmail = arg('admin-email');
  const adminPassword = arg('admin-password');
  const specialty = arg('specialty') ?? 'Medicina general';

  if (!slug || !clinic || !doctor || !adminEmail || !adminPassword) {
    console.error('Required: --slug --clinic --doctor --admin-email --admin-password');
    process.exit(1);
  }

  const exists = await Branding.findOne({ where: { slug } });
  if (exists) {
    console.error(`Branding slug "${slug}" already exists`);
    process.exit(1);
  }

  const emailTaken = await User.findOne({ where: { email: adminEmail.toLowerCase() } });
  if (emailTaken) {
    console.error(`Email "${adminEmail}" already in use`);
    process.exit(1);
  }

  const branding = await Branding.create({
    id: uuid(),
    slug,
    clinicName: clinic,
    doctorName: doctor,
    specialty,
    cedula: '',
    email: adminEmail,
    phone: '',
    address: '',
    logoEmoji: '🩺',
    signatureName: doctor,
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
  });

  const roleByName = await seedTenantRoles(branding.id);
  const adminRoleId = roleByName.admin;
  if (!adminRoleId) throw new Error('Failed to create admin role');

  const admin = await User.create({
    id: uuid(),
    brandingId: branding.id,
    email: adminEmail.toLowerCase(),
    password: await bcrypt.hash(adminPassword, 10),
    name: `Admin ${clinic}`,
    active: true,
  });

  await UserRole.create({ userId: admin.id, roleId: adminRoleId });

  const frontend = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  console.log('\nTenant created successfully');
  console.log(`  Slug:     ${slug}`);
  console.log(`  Admin:    ${adminEmail}`);
  console.log(`  Login:    ${frontend}/login`);
  console.log(`  Agendar:  ${frontend}/agendar/${slug}`);

  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
