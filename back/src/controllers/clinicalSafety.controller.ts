import { Request, Response } from 'express';
import { z } from 'zod';
import { ClinicalAnswer, Patient } from '../models';
import { findTenantPatient } from '../middleware/tenant';
import {
  evaluateClinicalSafety,
  type ClinicalSafetyReport,
  type PrescriptionItemInput,
} from '../services/clinicalSafety/evaluateClinicalSafety';
import type { SystemicContext } from '../services/clinicalSafety/systemicRules';

async function loadClinicalAnswers(patientId: string): Promise<Record<string, string | string[] | null>> {
  const items = await ClinicalAnswer.findAll({ where: { patientId } });
  const answers: Record<string, string | string[] | null> = {};
  for (const it of items) answers[it.questionCode] = it.value;
  return answers;
}

export const contextSchema = z.enum(['prescription', 'procedure']);

export const checkBodySchema = z.object({
  context: contextSchema.default('prescription'),
  items: z
    .array(
      z.object({
        medication: z.string().default(''),
        dose: z.string().optional(),
        frequency: z.string().optional(),
        duration: z.string().optional(),
      }),
    )
    .default([]),
});

export async function getForPatient(req: Request, res: Response): Promise<void> {
  const patient = await findTenantPatient(req, req.params.id);
  const rawContext = req.query.context as string | undefined;
  const parsed = contextSchema.safeParse(rawContext ?? 'prescription');
  if (!parsed.success) {
    res.status(400).json({ error: { message: 'context inválido' } });
    return;
  }

  const clinicalAnswers = await loadClinicalAnswers(patient.id);
  const report = evaluateClinicalSafety({
    patient,
    clinicalAnswers,
    context: parsed.data,
  });
  res.json({ data: report });
}

export async function checkForPatient(req: Request, res: Response): Promise<void> {
  const patient = await findTenantPatient(req, req.params.id);
  const body = req.body as z.infer<typeof checkBodySchema>;
  const clinicalAnswers = await loadClinicalAnswers(patient.id);
  const report = evaluateClinicalSafety({
    patient,
    clinicalAnswers,
    prescriptionItems: body.items,
    context: body.context,
  });
  res.json({ data: report });
}

export async function buildPrescriptionSafetyReport(
  patient: Patient,
  items: PrescriptionItemInput[],
): Promise<ClinicalSafetyReport> {
  const clinicalAnswers = await loadClinicalAnswers(patient.id);
  return evaluateClinicalSafety({
    patient,
    clinicalAnswers,
    prescriptionItems: items,
    context: 'prescription',
  });
}
