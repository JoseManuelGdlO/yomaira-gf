import { Request, Response } from 'express';
import { z } from 'zod';
import { ClinicalQuestion } from '../models';
import { Forbidden, NotFound } from '../utils/errors';

export async function list(_req: Request, res: Response): Promise<void> {
  const items = await ClinicalQuestion.findAll({
    order: [
      ['builtin', 'DESC'],
      ['position', 'ASC'],
      ['createdAt', 'ASC'],
    ],
  });
  res.json({ data: items });
}

export const createSchema = z.object({
  code: z.string().min(1).optional(),
  section: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'textarea', 'yes_no', 'checkbox_group']),
  options: z.array(z.string()).nullable().optional(),
  position: z.number().int().min(0).optional(),
});

export const updateSchema = createSchema.partial();

function genCode(): string {
  return 'cq-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof createSchema>;
  const item = await ClinicalQuestion.create({
    code: body.code ?? genCode(),
    section: body.section,
    label: body.label,
    type: body.type,
    options: body.options ?? null,
    position: body.position ?? 0,
    builtin: false,
  });
  res.status(201).json({ data: item });
}

export async function update(req: Request, res: Response): Promise<void> {
  const item = await ClinicalQuestion.findByPk(req.params.id);
  if (!item) throw NotFound('Clinical question not found');
  if (item.builtin) throw Forbidden('Builtin questions cannot be modified');
  await item.update(req.body);
  res.json({ data: item });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const item = await ClinicalQuestion.findByPk(req.params.id);
  if (!item) throw NotFound('Clinical question not found');
  await item.destroy();
  res.status(204).end();
}
