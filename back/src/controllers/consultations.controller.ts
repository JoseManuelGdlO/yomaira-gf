import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import { Consultation, Patient, sequelize } from '../models';
import { findTenantPatient } from '../middleware/tenant';
import {
  handleInventoryUsagesOnSave,
  loadConsultationUsages,
  restoreInventoryForConsultation,
} from '../services/inventory/inventoryService';
import {
  deleteChargeForConsultation,
  loadChargesForConsultations,
  upsertChargeFromConsultation,
} from '../services/finance/financeService';
import { chargeSchema } from './finances.controller';
import { NotFound } from '../utils/errors';

export const inventoryUsagesSchema = z.array(
  z.object({
    inventoryItemId: z.string().uuid(),
    quantity: z.number().positive(),
  }),
);

export const querySchema = z.object({
  patientId: z.string().uuid().optional(),
  q: z.string().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

function patientInclude(brandingId: string) {
  return {
    model: Patient,
    as: 'patient',
    where: { brandingId },
    required: true,
    attributes: ['id', 'name', 'avatarColor', 'allergies'],
  };
}

async function findTenantConsultation(req: Request, id: string): Promise<Consultation> {
  const item = await Consultation.findOne({
    where: { id },
    include: [{ model: Patient, as: 'patient', where: { brandingId: req.user!.brandingId }, required: true }],
  });
  if (!item) throw NotFound('Consultation not found');
  return item;
}

async function attachChargesAndUsages(items: Consultation[]) {
  const usageMap = await loadConsultationUsages(items.map((i) => i.id));
  const chargeMap = await loadChargesForConsultations(items.map((i) => i.id));
  return items.map((item) => ({
    ...item.toJSON(),
    inventoryUsages: usageMap.get(item.id) ?? [],
    charge: chargeMap.get(item.id) ?? null,
  }));
}

export async function list(req: Request, res: Response): Promise<void> {
  const { patientId, q, from, to, limit, offset } = req.query as z.infer<typeof querySchema>;
  const where: Record<string, unknown> = {};

  if (patientId) {
    await findTenantPatient(req, patientId);
    where.patientId = patientId;
  }

  if (from || to) {
    const dateWhere: { [Op.gte]?: string; [Op.lte]?: string } = {};
    if (from) dateWhere[Op.gte] = from;
    if (to) dateWhere[Op.lte] = to;
    where.date = dateWhere;
  }

  if (q) {
    Object.assign(where, {
      [Op.or]: [
        { reason: { [Op.like]: `%${q}%` } },
        { diagnosis: { [Op.like]: `%${q}%` } },
        { treatment: { [Op.like]: `%${q}%` } },
        { doctor: { [Op.like]: `%${q}%` } },
        { evolutionNote: { [Op.like]: `%${q}%` } },
        { '$patient.name$': { [Op.like]: `%${q}%` } },
      ],
    });
  }

  const queryOptions = {
    where,
    include: [patientInclude(req.user!.brandingId)],
    order: [['date', 'DESC']] as [string, string][],
    subQuery: false,
  };

  if (limit !== undefined) {
    const offsetVal = offset ?? 0;
    const { rows, count } = await Consultation.findAndCountAll({
      ...queryOptions,
      limit,
      offset: offsetVal,
      distinct: true,
    });
    res.json({
      data: await attachChargesAndUsages(rows),
      meta: { total: count, limit, offset: offsetVal },
    });
    return;
  }

  const items = await Consultation.findAll(queryOptions);
  res.json({ data: await attachChargesAndUsages(items) });
}

export async function get(req: Request, res: Response): Promise<void> {
  const item = await findTenantConsultation(req, req.params.id);
  const [enriched] = await attachChargesAndUsages([item]);
  res.json({ data: enriched });
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
  inventoryUsages: inventoryUsagesSchema.default([]),
  charge: chargeSchema.nullish(),
});

export const updateSchema = createSchema.partial();

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof createSchema>;
  const patient = await findTenantPatient(req, body.patientId);
  const { inventoryUsages, charge, ...consultationData } = body;

  const item = await sequelize.transaction(async (t) => {
    const consultation = await Consultation.create(consultationData, { transaction: t });
    if (body.date >= patient.lastVisit) {
      patient.lastVisit = body.date;
      await patient.save({ transaction: t });
    }
    await handleInventoryUsagesOnSave({
      consultationId: consultation.id,
      brandingId: req.user!.brandingId,
      usages: inventoryUsages,
      permissions: req.user!.permissions,
      roles: req.user!.roles,
      isUpdate: false,
      transaction: t,
    });
    if (charge !== undefined) {
      await upsertChargeFromConsultation({
        consultation,
        brandingId: req.user!.brandingId,
        userId: req.user!.id,
        charge,
        transaction: t,
      });
    }
    return consultation;
  });

  const [enriched] = await attachChargesAndUsages([item]);
  res.status(201).json({ data: enriched });
}

export async function update(req: Request, res: Response): Promise<void> {
  const item = await findTenantConsultation(req, req.params.id);
  const body = req.body as z.infer<typeof updateSchema>;
  if (body.patientId) await findTenantPatient(req, body.patientId);

  const inventoryUsages = body.inventoryUsages;
  const charge = body.charge;

  await sequelize.transaction(async (t) => {
    const { inventoryUsages: _u, charge: _c, ...consultationData } = body;
    await item.update(consultationData, { transaction: t });
    if (body.date) {
      const patient = await Patient.findByPk(item.patientId, { transaction: t });
      if (patient && body.date >= patient.lastVisit) {
        patient.lastVisit = body.date;
        await patient.save({ transaction: t });
      }
    }
    if (inventoryUsages !== undefined) {
      await handleInventoryUsagesOnSave({
        consultationId: item.id,
        brandingId: req.user!.brandingId,
        usages: inventoryUsages,
        permissions: req.user!.permissions,
        roles: req.user!.roles,
        isUpdate: true,
        transaction: t,
      });
    }
    if (charge !== undefined) {
      await upsertChargeFromConsultation({
        consultation: item,
        brandingId: req.user!.brandingId,
        userId: req.user!.id,
        charge,
        transaction: t,
      });
    }
  });

  const refreshed = await findTenantConsultation(req, item.id);
  const [enriched] = await attachChargesAndUsages([refreshed]);
  res.json({ data: enriched });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const item = await findTenantConsultation(req, req.params.id);
  await sequelize.transaction(async (t) => {
    await restoreInventoryForConsultation(item.id, req.user!.brandingId, t);
    await deleteChargeForConsultation(item.id, t);
    await item.destroy({ transaction: t });
  });
  res.status(204).end();
}
