import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import { Patient, sequelize } from '../models';
import { findTenantPatient, tenantWhere } from '../middleware/tenant';
import { NotFound } from '../utils/errors';

export const querySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  gender: z.enum(['M', 'F']).optional(),
  allergies: z.enum(['yes', 'no']).optional(),
  conditions: z.enum(['yes', 'no']).optional(),
  lastVisit: z.enum(['recent', 'overdue']).optional(),
  ageMin: z.coerce.number().int().min(0).max(120).optional(),
  ageMax: z.coerce.number().int().min(0).max(120).optional(),
  sortBy: z.enum(['name', 'age', 'lastVisit']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

const SORTABLE_FIELDS = {
  name: 'name',
  age: 'age',
  lastVisit: 'lastVisit',
} as const;

function sixMonthsAgoISO(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function list(req: Request, res: Response): Promise<void> {
  const {
    q,
    limit,
    offset,
    gender,
    allergies,
    conditions,
    lastVisit,
    ageMin,
    ageMax,
    sortBy,
    sortDir,
  } = req.query as z.infer<typeof querySchema>;

  const where: Record<string, unknown> = { ...tenantWhere(req) };
  const andClauses: unknown[] = [];

  if (q) {
    andClauses.push({
      [Op.or]: [
        { name: { [Op.like]: `%${q}%` } },
        { guardian: { [Op.like]: `%${q}%` } },
      ],
    });
  }

  if (gender) where.gender = gender;

  if (ageMin !== undefined || ageMax !== undefined) {
    const ageWhere: { [Op.gte]?: number; [Op.lte]?: number } = {};
    if (ageMin !== undefined) ageWhere[Op.gte] = ageMin;
    if (ageMax !== undefined) ageWhere[Op.lte] = ageMax;
    where.age = ageWhere;
  }

  if (allergies === 'yes') andClauses.push(sequelize.literal('JSON_LENGTH(`allergies`) > 0'));
  else if (allergies === 'no') andClauses.push(sequelize.literal('JSON_LENGTH(`allergies`) = 0'));

  if (conditions === 'yes') andClauses.push(sequelize.literal('JSON_LENGTH(`conditions`) > 0'));
  else if (conditions === 'no') andClauses.push(sequelize.literal('JSON_LENGTH(`conditions`) = 0'));

  if (lastVisit === 'recent') {
    where.lastVisit = { [Op.gte]: sixMonthsAgoISO() };
  } else if (lastVisit === 'overdue') {
    where.lastVisit = { [Op.lt]: sixMonthsAgoISO() };
  }

  if (andClauses.length > 0) {
    Object.assign(where, { [Op.and]: andClauses });
  }

  const sortField = SORTABLE_FIELDS[sortBy ?? 'name'] ?? 'name';
  const sortDirection = (sortDir ?? 'asc').toUpperCase();
  const order: [string, string][] = [[sortField, sortDirection]];

  if (limit !== undefined) {
    const offsetVal = offset ?? 0;
    const { rows, count } = await Patient.findAndCountAll({ where, order, limit, offset: offsetVal });
    res.json({ data: rows, meta: { total: count, limit, offset: offsetVal } });
    return;
  }

  const items = await Patient.findAll({ where, order });
  res.json({ data: items });
}

export async function get(req: Request, res: Response): Promise<void> {
  const item = await findTenantPatient(req, req.params.id);
  res.json({ data: item });
}

const baseSchema = {
  name: z.string().min(1),
  age: z.number().int().min(0).max(120),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['M', 'F']),
  guardian: z.string().default(''),
  guardianPhone: z.string().default(''),
  email: z.string().default(''),
  allergies: z.array(z.string()).default([]),
  conditions: z.array(z.string()).default([]),
  bloodType: z.string().default('O+'),
  weightKg: z.number().min(0.5).max(200).nullable().optional(),
  lastVisit: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  avatarColor: z.string().default('#FCE4F5'),
  consentPhoto: z.string().nullable().optional(),
};

export const createSchema = z.object(baseSchema);
export const updateSchema = z.object(baseSchema).partial();

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof createSchema>;
  const item = await Patient.create({ ...body, brandingId: req.user!.brandingId });
  res.status(201).json({ data: item });
}

export async function update(req: Request, res: Response): Promise<void> {
  const item = await findTenantPatient(req, req.params.id);
  await item.update(req.body);
  res.json({ data: item });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const item = await findTenantPatient(req, req.params.id);
  await item.destroy();
  res.status(204).end();
}

export const consentPhotoSchema = z.object({ consentPhoto: z.string().nullable() });

export async function setConsentPhoto(req: Request, res: Response): Promise<void> {
  const item = await findTenantPatient(req, req.params.id);
  const { consentPhoto } = req.body as z.infer<typeof consentPhotoSchema>;
  item.consentPhoto = consentPhoto;
  await item.save();
  res.json({ data: item });
}
