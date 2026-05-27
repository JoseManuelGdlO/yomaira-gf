import { Request, Response } from 'express';
import { z } from 'zod';
import { Consultation, Patient, sequelize } from '../models';
import { findTenantPatient } from '../middleware/tenant';
import { NotFound } from '../utils/errors';

export const querySchema = z.object({ patientId: z.string().uuid().optional() });

async function findTenantConsultation(req: Request, id: string): Promise<Consultation> {
  const item = await Consultation.findOne({
    where: { id },
    include: [{ model: Patient, as: 'patient', where: { brandingId: req.user!.brandingId }, required: true }],
  });
  if (!item) throw NotFound('Consultation not found');
  return item;
}

export async function list(req: Request, res: Response): Promise<void> {
  const { patientId } = req.query as z.infer<typeof querySchema>;
  const where: Record<string, unknown> = {};
  if (patientId) {
    await findTenantPatient(req, patientId);
    where.patientId = patientId;
  }
  const items = await Consultation.findAll({
    where,
    include: [{ model: Patient, as: 'patient', where: { brandingId: req.user!.brandingId }, required: true }],
    order: [['date', 'DESC']],
  });
  res.json({ data: items });
}

export async function get(req: Request, res: Response): Promise<void> {
  const item = await findTenantConsultation(req, req.params.id);
  res.json({ data: item });
}

export const createSchema = z.object({
  patientId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().default(''),
  diagnosis: z.string().default(''),
  treatment: z.string().default(''),
  notes: z.string().default(''),
  nextTreatment: z.string().default(''),
  paymentAndNextAppointment: z.string().default(''),
  evolutionNote: z.string().default(''),
  doctor: z.string().default(''),
});

export const updateSchema = createSchema.partial();

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof createSchema>;
  const patient = await findTenantPatient(req, body.patientId);

  const item = await sequelize.transaction(async (t) => {
    const consultation = await Consultation.create(body, { transaction: t });
    if (body.date >= patient.lastVisit) {
      patient.lastVisit = body.date;
      await patient.save({ transaction: t });
    }
    return consultation;
  });

  res.status(201).json({ data: item });
}

export async function update(req: Request, res: Response): Promise<void> {
  const item = await findTenantConsultation(req, req.params.id);
  const body = req.body as z.infer<typeof updateSchema>;
  if (body.patientId) await findTenantPatient(req, body.patientId);

  await sequelize.transaction(async (t) => {
    await item.update(body, { transaction: t });
    if (body.date) {
      const patient = await Patient.findByPk(item.patientId, { transaction: t });
      if (patient && body.date >= patient.lastVisit) {
        patient.lastVisit = body.date;
        await patient.save({ transaction: t });
      }
    }
  });

  res.json({ data: item });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const item = await findTenantConsultation(req, req.params.id);
  await item.destroy();
  res.status(204).end();
}
