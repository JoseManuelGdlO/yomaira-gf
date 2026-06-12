import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import { FinanceCharge, FinanceExpense, Patient } from '../models';
import { findTenantPatient, requireBrandingId, tenantWhere } from '../middleware/tenant';
import {
  findChargeWithPatient,
  serializeFinanceCharge,
  serializeFinanceExpense,
  sumCharges,
  sumExpenses,
} from '../services/finance/financeService';
import { NotFound } from '../utils/errors';

export const paymentMethodSchema = z.enum(['efectivo', 'tarjeta', 'transferencia', 'otro']);

export const chargeSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: paymentMethodSchema,
  note: z.string().default(''),
});

export const chargeInputSchema = chargeSchema.nullable().optional();

export const dateRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  patientId: z.string().uuid().optional(),
  consultationId: z.string().uuid().optional(),
});

function dateWhere(from?: string, to?: string): Record<string, unknown> | undefined {
  if (from && to) return { [Op.gte]: from, [Op.lte]: to };
  if (from) return { [Op.gte]: from };
  if (to) return { [Op.lte]: to };
  return undefined;
}

async function findTenantCharge(req: Request, id: string): Promise<FinanceCharge> {
  const item = await findChargeWithPatient(req.user!.brandingId, id);
  if (!item) throw NotFound('Cobro no encontrado');
  return item;
}

async function findTenantExpense(req: Request, id: string): Promise<FinanceExpense> {
  const item = await FinanceExpense.findOne({ where: { id, ...tenantWhere(req) } });
  if (!item) throw NotFound('Gasto no encontrado');
  return item;
}

export async function listCharges(req: Request, res: Response): Promise<void> {
  const q = req.query as z.infer<typeof dateRangeSchema>;
  const brandingId = requireBrandingId(req);
  const where: Record<string, unknown> = { brandingId };

  const dateFilter = dateWhere(q.from, q.to);
  if (dateFilter) where.date = dateFilter;
  if (q.patientId) {
    await findTenantPatient(req, q.patientId);
    where.patientId = q.patientId;
  }
  if (q.consultationId) where.consultationId = q.consultationId;

  const items = await FinanceCharge.findAll({
    where,
    include: [{ model: Patient, as: 'patient', required: false }],
    order: [
      ['date', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
  res.json({ data: items.map(serializeFinanceCharge) });
}

export async function getCharge(req: Request, res: Response): Promise<void> {
  const item = await findTenantCharge(req, req.params.id);
  res.json({ data: serializeFinanceCharge(item) });
}

export const createChargeSchema = z.object({
  patientId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  paymentMethod: paymentMethodSchema,
  note: z.string().default(''),
});

export const updateChargeSchema = createChargeSchema.partial();

export async function createCharge(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof createChargeSchema>;
  await findTenantPatient(req, body.patientId);
  const item = await FinanceCharge.create({
    ...body,
    brandingId: req.user!.brandingId,
    consultationId: null,
    createdBy: req.user!.id,
  });
  const withPatient = await findChargeWithPatient(req.user!.brandingId, item.id);
  res.status(201).json({ data: serializeFinanceCharge(withPatient ?? item) });
}

export async function updateCharge(req: Request, res: Response): Promise<void> {
  const item = await findTenantCharge(req, req.params.id);
  const body = req.body as z.infer<typeof updateChargeSchema>;
  if (body.patientId) await findTenantPatient(req, body.patientId);
  await item.update(body);
  const refreshed = await findChargeWithPatient(req.user!.brandingId, item.id);
  res.json({ data: serializeFinanceCharge(refreshed ?? item) });
}

export async function removeCharge(req: Request, res: Response): Promise<void> {
  const item = await findTenantCharge(req, req.params.id);
  await item.destroy();
  res.status(204).end();
}

export async function listExpenses(req: Request, res: Response): Promise<void> {
  const q = req.query as z.infer<typeof dateRangeSchema>;
  const where: Record<string, unknown> = { ...tenantWhere(req) };
  const dateFilter = dateWhere(q.from, q.to);
  if (dateFilter) where.date = dateFilter;

  const items = await FinanceExpense.findAll({
    where,
    order: [
      ['date', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
  res.json({ data: items.map(serializeFinanceExpense) });
}

export async function getExpense(req: Request, res: Response): Promise<void> {
  const item = await findTenantExpense(req, req.params.id);
  res.json({ data: serializeFinanceExpense(item) });
}

export const createExpenseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  category: z.string().default(''),
  description: z.string().default(''),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export async function createExpense(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof createExpenseSchema>;
  const item = await FinanceExpense.create({
    ...body,
    brandingId: req.user!.brandingId,
    createdBy: req.user!.id,
  });
  res.status(201).json({ data: serializeFinanceExpense(item) });
}

export async function updateExpense(req: Request, res: Response): Promise<void> {
  const item = await findTenantExpense(req, req.params.id);
  await item.update(req.body);
  res.json({ data: serializeFinanceExpense(item) });
}

export async function removeExpense(req: Request, res: Response): Promise<void> {
  const item = await findTenantExpense(req, req.params.id);
  await item.destroy();
  res.status(204).end();
}

export async function summary(req: Request, res: Response): Promise<void> {
  const q = req.query as z.infer<typeof dateRangeSchema>;
  const brandingId = requireBrandingId(req);
  const [totalCharges, totalExpenses] = await Promise.all([
    sumCharges(brandingId, q.from, q.to),
    sumExpenses(brandingId, q.from, q.to),
  ]);
  res.json({
    data: {
      totalCharges,
      totalExpenses,
      balance: totalCharges - totalExpenses,
      from: q.from ?? null,
      to: q.to ?? null,
    },
  });
}
