import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import { Patient } from '../models';
import { NotFound } from '../utils/errors';

export const querySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export async function list(req: Request, res: Response): Promise<void> {
  const { q, limit, offset } = req.query as z.infer<typeof querySchema>;
  const where: Record<string, unknown> = {};
  if (q) {
    Object.assign(where, {
      [Op.or]: [
        { name: { [Op.like]: `%${q}%` } },
        { guardian: { [Op.like]: `%${q}%` } },
      ],
    });
  }
  const items = await Patient.findAll({ where, order: [['name', 'ASC']], limit, offset });
  res.json({ data: items });
}

export async function get(req: Request, res: Response): Promise<void> {
  const item = await Patient.findByPk(req.params.id);
  if (!item) throw NotFound('Patient not found');
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
  lastVisit: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  avatarColor: z.string().default('#FCE4F5'),
  consentPhoto: z.string().nullable().optional(),
};

export const createSchema = z.object(baseSchema);
export const updateSchema = z.object(baseSchema).partial();

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof createSchema>;
  const item = await Patient.create(body);
  res.status(201).json({ data: item });
}

export async function update(req: Request, res: Response): Promise<void> {
  const item = await Patient.findByPk(req.params.id);
  if (!item) throw NotFound('Patient not found');
  await item.update(req.body);
  res.json({ data: item });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const item = await Patient.findByPk(req.params.id);
  if (!item) throw NotFound('Patient not found');
  await item.destroy();
  res.status(204).end();
}

export const consentPhotoSchema = z.object({ consentPhoto: z.string().nullable() });

export async function setConsentPhoto(req: Request, res: Response): Promise<void> {
  const item = await Patient.findByPk(req.params.id);
  if (!item) throw NotFound('Patient not found');
  const { consentPhoto } = req.body as z.infer<typeof consentPhotoSchema>;
  item.consentPhoto = consentPhoto;
  await item.save();
  res.json({ data: item });
}
