import { Request, Response } from 'express';
import { z } from 'zod';
import { Patient, Prescription, PrescriptionItem, sequelize } from '../models';
import { NotFound } from '../utils/errors';

export const querySchema = z.object({ patientId: z.string().uuid().optional() });

const includeItems = {
  include: [{ model: PrescriptionItem, as: 'items' }],
};

function serialize(rx: Prescription): Record<string, unknown> {
  const items = ((rx as any).items ?? []) as PrescriptionItem[];
  const sorted = [...items].sort((a, b) => a.position - b.position);
  return {
    id: rx.id,
    patientId: rx.patientId,
    date: rx.date,
    diagnosis: rx.diagnosis,
    indications: rx.indications,
    items: sorted.map((it) => ({
      medication: it.medication,
      dose: it.dose,
      frequency: it.frequency,
      duration: it.duration,
    })),
    createdAt: rx.createdAt,
    updatedAt: rx.updatedAt,
  };
}

export async function list(req: Request, res: Response): Promise<void> {
  const { patientId } = req.query as z.infer<typeof querySchema>;
  const where: Record<string, unknown> = {};
  if (patientId) where.patientId = patientId;
  const items = await Prescription.findAll({
    where,
    ...includeItems,
    order: [['date', 'DESC']],
  });
  res.json({ data: items.map(serialize) });
}

export async function get(req: Request, res: Response): Promise<void> {
  const rx = await Prescription.findOne({
    where: { id: req.params.id },
    ...includeItems,
  });
  if (!rx) throw NotFound('Prescription not found');
  res.json({ data: serialize(rx) });
}

const itemSchema = z.object({
  medication: z.string().default(''),
  dose: z.string().default(''),
  frequency: z.string().default(''),
  duration: z.string().default(''),
});

export const createSchema = z.object({
  patientId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  diagnosis: z.string().default(''),
  indications: z.string().default(''),
  items: z.array(itemSchema).default([]),
});

export const updateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  diagnosis: z.string().optional(),
  indications: z.string().optional(),
  items: z.array(itemSchema).optional(),
});

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof createSchema>;
  const patient = await Patient.findByPk(body.patientId);
  if (!patient) throw NotFound('Patient not found');
  const rx = await sequelize.transaction(async (t) => {
    const created = await Prescription.create(
      {
        patientId: body.patientId,
        date: body.date,
        diagnosis: body.diagnosis,
        indications: body.indications,
      },
      { transaction: t },
    );
    if (body.items.length) {
      await PrescriptionItem.bulkCreate(
        body.items.map((it, index) => ({ ...it, prescriptionId: created.id, position: index })),
        { transaction: t },
      );
    }
    return created;
  });
  const fresh = await Prescription.findByPk(rx.id, includeItems);
  res.status(201).json({ data: serialize(fresh!) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const rx = await Prescription.findByPk(req.params.id);
  if (!rx) throw NotFound('Prescription not found');
  const body = req.body as z.infer<typeof updateSchema>;
  await sequelize.transaction(async (t) => {
    await rx.update(
      {
        ...(body.date ? { date: body.date } : {}),
        ...(body.diagnosis !== undefined ? { diagnosis: body.diagnosis } : {}),
        ...(body.indications !== undefined ? { indications: body.indications } : {}),
      },
      { transaction: t },
    );
    if (body.items) {
      await PrescriptionItem.destroy({ where: { prescriptionId: rx.id }, transaction: t });
      if (body.items.length) {
        await PrescriptionItem.bulkCreate(
          body.items.map((it, index) => ({ ...it, prescriptionId: rx.id, position: index })),
          { transaction: t },
        );
      }
    }
  });
  const fresh = await Prescription.findByPk(rx.id, includeItems);
  res.json({ data: serialize(fresh!) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const rx = await Prescription.findByPk(req.params.id);
  if (!rx) throw NotFound('Prescription not found');
  await rx.destroy();
  res.status(204).end();
}
