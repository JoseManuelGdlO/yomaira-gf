#!/usr/bin/env ts-node
/**
 * Create a new consultorio (tenant) with default roles and admin user.
 *
 * Usage:
 *   npm run tenant:create -- --slug drgarcia --clinic "Consultorio Dr. García" \
 *     --doctor "Dr. García" --admin-email admin@drgarcia.com --admin-password 'Secret123!'
 */
import 'dotenv/config';
import { sequelize } from '../src/models';
import { createTenant } from '../src/services/tenant/tenantManagement';

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

  const result = await createTenant({
    slug,
    clinicName: clinic,
    doctorName: doctor,
    specialty,
    adminEmail,
    adminPassword,
  });

  const frontend = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  console.log('\nTenant created successfully');
  console.log(`  Slug:     ${result.slug}`);
  console.log(`  Admin:    ${result.adminEmail}`);
  console.log(`  Login:    ${frontend}/login`);
  console.log(`  Agendar:  ${frontend}/agendar/${result.slug}`);

  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
