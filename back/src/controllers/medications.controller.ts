import { Request, Response } from 'express';
import { z } from 'zod';
import { Medication } from '../models';
import { tenantWhere } from '../middleware/tenant';
import { NotFound } from '../utils/errors';

async function findTenantMedication(req: Request, id: string): Promise<Medication> {
  const item = await Medication.findOne({ where: { id, ...tenantWhere(req) } });
  if (!item) throw NotFound('Medication not found');
  return item;
}

export async function list(req: Request, res: Response): Promise<void> {
  const items = await Medication.findAll({ where: tenantWhere(req), order: [['name', 'ASC']] });
  res.json({ data: items });
}

export async function get(req: Request, res: Response): Promise<void> {
  const item = await findTenantMedication(req, req.params.id);
  res.json({ data: item });
}

export const createSchema = z.object({
  name: z.string().min(1),
  presentation: z.string().default(''),
});

export const updateSchema = createSchema.partial();

export async function create(req: Request, res: Response): Promise<void> {
  const item = await Medication.create({ ...req.body, brandingId: req.user!.brandingId });
  res.status(201).json({ data: item });
}

export async function update(req: Request, res: Response): Promise<void> {
  const item = await findTenantMedication(req, req.params.id);
  await item.update(req.body);
  res.json({ data: item });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const item = await findTenantMedication(req, req.params.id);
  await item.destroy();
  res.status(204).end();
}
