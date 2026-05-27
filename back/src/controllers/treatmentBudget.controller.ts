import { Request, Response } from 'express';
import { z } from 'zod';
import { TreatmentBudget, type BudgetItem } from '../models/TreatmentBudget';
import { findTenantPatient } from '../middleware/tenant';

const budgetItemSchema = z.object({
  description: z.string().min(1),
  tooth: z.string().optional(),
  amount: z.number().min(0),
});

export const upsertSchema = z.object({
  items: z.array(budgetItemSchema),
  notes: z.string().optional(),
});

function computeTotal(items: BudgetItem[]): number {
  return items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
}

function serialize(budget: TreatmentBudget): Record<string, unknown> {
  const items = budget.items ?? [];
  const total = computeTotal(items);
  return {
    id: budget.id,
    patientId: budget.patientId,
    status: budget.status,
    items,
    notes: budget.notes,
    subtotal: total,
    total,
  };
}

export async function getForPatient(req: Request, res: Response): Promise<void> {
  const patient = await findTenantPatient(req, req.params.id);
  let budget = await TreatmentBudget.findOne({
    where: { patientId: patient.id, status: 'active' },
  });
  if (!budget) {
    budget = await TreatmentBudget.create({
      patientId: patient.id,
      brandingId: req.user!.brandingId,
      status: 'active',
      items: [],
      notes: '',
    });
  }
  res.json({ data: serialize(budget) });
}

export async function upsertForPatient(req: Request, res: Response): Promise<void> {
  const patient = await findTenantPatient(req, req.params.id);
  const body = req.body as z.infer<typeof upsertSchema>;

  let budget = await TreatmentBudget.findOne({
    where: { patientId: patient.id, status: 'active' },
  });
  if (!budget) {
    budget = await TreatmentBudget.create({
      patientId: patient.id,
      brandingId: req.user!.brandingId,
      status: 'active',
      items: body.items,
      notes: body.notes ?? '',
    });
  } else {
    await budget.update({ items: body.items, notes: body.notes ?? budget.notes });
  }
  res.json({ data: serialize(budget) });
}
