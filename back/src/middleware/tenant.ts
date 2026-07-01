import { NextFunction, Request, Response } from 'express';
import { Branding, Patient } from '../models';
import { PLATFORM_SLUG } from '../services/tenant/tenantManagement';
import { Forbidden, NotFound, Unauthorized } from '../utils/errors';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getActingBrandingId(req: Request): string {
  if (!req.user?.brandingId) throw Unauthorized('Tenant context required');
  return req.actingBrandingId ?? req.user.brandingId;
}

export function requireBrandingId(req: Request): string {
  return getActingBrandingId(req);
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
  if (!branding.active) throw Forbidden('Consultorio inactive');
  return branding;
}

export function requirePublicSlug(req: Request): string {
  const slug = (req.query.slug as string | undefined)?.trim();
  if (!slug) {
    throw NotFound('Consultorio slug required');
  }
  return slug;
}

/** Platform admin may scope API calls to another consultorio via X-Acting-Tenant-Id. */
export async function resolveActingTenant(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      return next();
    }

    const header = (req.headers['x-acting-tenant-id'] as string | undefined)?.trim();
    if (header && req.user.roles.includes('platform_admin')) {
      if (!UUID_RE.test(header)) {
        throw Forbidden('Invalid acting tenant id');
      }
      const branding = await Branding.findByPk(header);
      if (!branding || !branding.active || branding.slug === PLATFORM_SLUG) {
        throw Forbidden('Invalid or inactive consultorio');
      }
      req.actingBrandingId = branding.id;
    } else {
      req.actingBrandingId = req.user.brandingId;
    }

    next();
  } catch (err) {
    next(err);
  }
}

export function isPlatformAdminActingAsTenant(req: Request): boolean {
  if (!req.user?.roles.includes('platform_admin')) return false;
  if (!req.actingBrandingId) return false;
  return req.actingBrandingId !== req.user.brandingId;
}
