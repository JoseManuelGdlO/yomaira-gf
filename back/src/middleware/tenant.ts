import { Request } from 'express';
import { Branding, Patient } from '../models';
import { Forbidden, NotFound, Unauthorized } from '../utils/errors';

export function requireBrandingId(req: Request): string {
  if (!req.user?.brandingId) throw Unauthorized('Tenant context required');
  return req.user.brandingId;
}

export function tenantWhere(req: Request): { brandingId: string } {
  return { brandingId: requireBrandingId(req) };
}

export function assertSameBranding(req: Request, brandingId: string): void {
  if (requireBrandingId(req) !== brandingId) throw Forbidden('Resource belongs to another consultorio');
}

export async function findTenantPatient(req: Request, patientId: string): Promise<Patient> {
  const patient = await Patient.findOne({
    where: { id: patientId, brandingId: requireBrandingId(req) },
  });
  if (!patient) throw NotFound('Patient not found');
  return patient;
}

export async function resolveBrandingBySlug(slug: string): Promise<Branding> {
  const branding = await Branding.findOne({ where: { slug } });
  if (!branding) throw NotFound('Consultorio not found');
  return branding;
}

export function requirePublicSlug(req: Request): string {
  const slug = (req.query.slug as string | undefined)?.trim();
  if (!slug) {
    throw NotFound('Consultorio slug required');
  }
  return slug;
}
