import { Request, Response } from 'express';
import { z } from 'zod';
import { TreatmentBudget, type BudgetItem } from '../models/TreatmentBudget';
import { findTenantPatient } from '../middleware/tenant';
import { BadRequest } from '../utils/errors';

const MAX_ATTACHMENT_BYTES = 12 * 1024 * 1024;

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
    attachment: budget.attachment,
    attachmentFileName: budget.attachmentFileName,
    subtotal: total,
    total,
  };
}

function assertAttachmentSize(attachment: string | null): void {
  if (!attachment) return;
  const approxBytes = Math.ceil((attachment.length * 3) / 4);
  if (approxBytes > MAX_ATTACHMENT_BYTES) {
    throw BadRequest('El archivo supera el tamaño máximo (12 MB)');
  }
}

async function findOrCreateBudget(req: Request, patientId: string): Promise<TreatmentBudget> {
  let budget = await TreatmentBudget.findOne({
    where: { patientId, status: 'active' },
  });
  if (!budget) {
    budget = await TreatmentBudget.create({
      patientId,
      brandingId: req.user!.brandingId,
      status: 'active',
      items: [],
      notes: '',
      attachment: null,
      attachmentFileName: null,
    });
  }
  return budget;
}

export async function getForPatient(req: Request, res: Response): Promise<void> {
  const patient = await findTenantPatient(req, req.params.id);
  const budget = await findOrCreateBudget(req, patient.id);
  res.json({ data: serialize(budget) });
}

export async function upsertForPatient(req: Request, res: Response): Promise<void> {
  const patient = await findTenantPatient(req, req.params.id);
  const body = req.body as z.infer<typeof upsertSchema>;

  const budget = await findOrCreateBudget(req, patient.id);
  await budget.update({ items: body.items, notes: body.notes ?? budget.notes });
  res.json({ data: serialize(budget) });
}

export const attachmentSchema = z.object({
  attachment: z.string().nullable(),
  attachmentFileName: z.string().max(255).nullable().optional(),
});

export async function setAttachmentForPatient(req: Request, res: Response): Promise<void> {
  const patient = await findTenantPatient(req, req.params.id);
  const body = req.body as z.infer<typeof attachmentSchema>;
  assertAttachmentSize(body.attachment);

  const budget = await findOrCreateBudget(req, patient.id);
  await budget.update({
    attachment: body.attachment,
    attachmentFileName: body.attachment ? (body.attachmentFileName ?? null) : null,
  });
  res.json({ data: serialize(budget) });
}
