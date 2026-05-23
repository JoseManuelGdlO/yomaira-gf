import { Request, Response } from 'express';
import { z } from 'zod';
import { Consultation, Patient } from '../models';
import { NotFound } from '../utils/errors';

export const querySchema = z.object({ patientId: z.string().uuid().optional() });

export async function list(req: Request, res: Response): Promise<void> {
  const { patientId } = req.query as z.infer<typeof querySchema>;
  const where: Record<string, unknown> = {};
  if (patientId) where.patientId = patientId;
  const items = await Consultation.findAll({ where, order: [['date', 'DESC']] });
  res.json({ data: items });
}

export async function get(req: Request, res: Response): Promise<void> {
  const item = await Consultation.findByPk(req.params.id);
  if (!item) throw NotFound('Consultation not found');
  res.json({ data: item });
}

export const createSchema = z.object({
  patientId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().default(''),
  diagnosis: z.string().default(''),
  treatment: z.string().default(''),
  notes: z.string().default(''),
  doctor: z.string().default(''),
});

export const updateSchema = createSchema.partial();

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof createSchema>;
  const patient = await Patient.findByPk(body.patientId);
  if (!patient) throw NotFound('Patient not found');
  const item = await Consultation.create(body);
  res.status(201).json({ data: item });
}

export async function update(req: Request, res: Response): Promise<void> {
  const item = await Consultation.findByPk(req.params.id);
  if (!item) throw NotFound('Consultation not found');
  if (req.body.patientId) {
    const patient = await Patient.findByPk(req.body.patientId);
    if (!patient) throw NotFound('Patient not found');
  }
  await item.update(req.body);
  res.json({ data: item });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const item = await Consultation.findByPk(req.params.id);
  if (!item) throw NotFound('Consultation not found');
  await item.destroy();
  res.status(204).end();
}
