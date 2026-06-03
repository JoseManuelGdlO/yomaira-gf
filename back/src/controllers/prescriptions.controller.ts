import { Request, Response } from 'express';
import { z } from 'zod';
import { Patient, Prescription, PrescriptionItem, sequelize } from '../models';
import { findTenantPatient } from '../middleware/tenant';
import { buildPrescriptionSafetyReport } from './clinicalSafety.controller';
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

async function findTenantPrescription(req: Request, id: string): Promise<Prescription> {
  const rx = await Prescription.findOne({
    where: { id },
    include: [
      { model: PrescriptionItem, as: 'items' },
      { model: Patient, as: 'patient', where: { brandingId: req.user!.brandingId }, required: true },
    ],
  });
  if (!rx) throw NotFound('Prescription not found');
  return rx;
}

export async function list(req: Request, res: Response): Promise<void> {
  const { patientId } = req.query as z.infer<typeof querySchema>;
  const where: Record<string, unknown> = {};
  if (patientId) {
    await findTenantPatient(req, patientId);
    where.patientId = patientId;
  }
  const items = await Prescription.findAll({
    where,
    include: [
      { model: PrescriptionItem, as: 'items' },
      { model: Patient, as: 'patient', where: { brandingId: req.user!.brandingId }, required: true },
    ],
    order: [['date', 'DESC']],
  });
  res.json({ data: items.map(serialize) });
}

export async function get(req: Request, res: Response): Promise<void> {
  const rx = await findTenantPrescription(req, req.params.id);
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
  const patient = await findTenantPatient(req, body.patientId);
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
  const warnings = await buildPrescriptionSafetyReport(patient, body.items);
  res.status(201).json({ data: serialize(fresh!), warnings: warnings.alerts });
}

export async function update(req: Request, res: Response): Promise<void> {
  const rx = await findTenantPrescription(req, req.params.id);
  const body = req.body as z.infer<typeof updateSchema>;
  const patient = await findTenantPatient(req, rx.patientId);
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
  const items = body.items ?? ((fresh as any).items ?? []).map((it: PrescriptionItem) => ({
    medication: it.medication,
    dose: it.dose,
    frequency: it.frequency,
    duration: it.duration,
  }));
  const warnings = await buildPrescriptionSafetyReport(patient, items);
  res.json({ data: serialize(fresh!), warnings: warnings.alerts });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const rx = await findTenantPrescription(req, req.params.id);
  await rx.destroy();
  res.status(204).end();
}
