import { Request, Response } from 'express';
import { z } from 'zod';
import { Medication } from '../models';
import { NotFound } from '../utils/errors';

export async function list(_req: Request, res: Response): Promise<void> {
  const items = await Medication.findAll({ order: [['name', 'ASC']] });
  res.json({ data: items });
}

export async function get(req: Request, res: Response): Promise<void> {
  const item = await Medication.findByPk(req.params.id);
  if (!item) throw NotFound('Medication not found');
  res.json({ data: item });
}

export const createSchema = z.object({
  name: z.string().min(1),
  presentation: z.string().default(''),
});

export const updateSchema = createSchema.partial();

export async function create(req: Request, res: Response): Promise<void> {
  const item = await Medication.create(req.body);
  res.status(201).json({ data: item });
}

export async function update(req: Request, res: Response): Promise<void> {
  const item = await Medication.findByPk(req.params.id);
  if (!item) throw NotFound('Medication not found');
  await item.update(req.body);
  res.json({ data: item });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const item = await Medication.findByPk(req.params.id);
  if (!item) throw NotFound('Medication not found');
  await item.destroy();
  res.status(204).end();
}
