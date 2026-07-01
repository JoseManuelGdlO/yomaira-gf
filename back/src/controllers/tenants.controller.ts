import { Request, Response } from 'express';
import { z } from 'zod';
import { Permission, Role, User } from '../models';
import { serializeUser } from './users.controller';
import {
  createTenant,
  deactivateTenant,
  getTenant,
  listTenants,
  updateTenant,
} from '../services/tenant/tenantManagement';
import { NotFound } from '../utils/errors';

const includeRoles = {
  include: [{ model: Role, through: { attributes: [] }, include: [{ model: Permission, through: { attributes: [] } }] }],
};

export const createSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  clinicName: z.string().min(1).max(190),
  doctorName: z.string().min(1).max(190),
  specialty: z.string().max(120).optional(),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});

export const updateSchema = z.object({
  clinicName: z.string().min(1).max(190).optional(),
  doctorName: z.string().min(1).max(190).optional(),
  specialty: z.string().max(120).optional(),
  email: z.string().email().optional(),
  adminPassword: z.string().min(8).optional(),
});

export async function list(_req: Request, res: Response): Promise<void> {
  const data = await listTenants();
  res.json({ data });
}

export async function get(req: Request, res: Response): Promise<void> {
  const data = await getTenant(req.params.id);
  res.json({ data });
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof createSchema>;
  const data = await createTenant({
    slug: body.slug,
    clinicName: body.clinicName,
    doctorName: body.doctorName,
    specialty: body.specialty,
    adminEmail: body.adminEmail,
    adminPassword: body.adminPassword,
  });
  res.status(201).json({ data });
}

export async function update(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof updateSchema>;
  const data = await updateTenant(req.params.id, body);
  res.json({ data });
}

export async function deactivate(req: Request, res: Response): Promise<void> {
  const data = await deactivateTenant(req.params.id);
  res.json({ data });
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const tenant = await getTenant(req.params.id);
  if (!tenant.active) throw NotFound('Consultorio not found');

  const users = await User.findAll({
    where: { brandingId: req.params.id },
    ...includeRoles,
    order: [['name', 'ASC']],
  });

  res.json({ data: users.map(serializeUser) });
}
