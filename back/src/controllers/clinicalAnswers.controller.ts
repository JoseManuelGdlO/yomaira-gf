import { Request, Response } from 'express';
import { z } from 'zod';
import { ClinicalAnswer, Patient, sequelize } from '../models';
import { NotFound } from '../utils/errors';

export async function getForPatient(req: Request, res: Response): Promise<void> {
  const patient = await Patient.findByPk(req.params.id);
  if (!patient) throw NotFound('Patient not found');
  const items = await ClinicalAnswer.findAll({ where: { patientId: patient.id } });
  const answers: Record<string, string | string[] | null> = {};
  for (const it of items) answers[it.questionCode] = it.value;
  res.json({ data: { patientId: patient.id, answers } });
}

export const upsertSchema = z.object({
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string()), z.null()])),
});

export async function upsertForPatient(req: Request, res: Response): Promise<void> {
  const patient = await Patient.findByPk(req.params.id);
  if (!patient) throw NotFound('Patient not found');
  const { answers } = req.body as z.infer<typeof upsertSchema>;

  await sequelize.transaction(async (t) => {
    for (const [code, value] of Object.entries(answers)) {
      const existing = await ClinicalAnswer.findOne({
        where: { patientId: patient.id, questionCode: code },
        transaction: t,
      });
      if (existing) {
        existing.value = value;
        await existing.save({ transaction: t });
      } else {
        await ClinicalAnswer.create(
          { patientId: patient.id, questionCode: code, value },
          { transaction: t },
        );
      }
    }
  });

  const items = await ClinicalAnswer.findAll({ where: { patientId: patient.id } });
  const map: Record<string, string | string[] | null> = {};
  for (const it of items) map[it.questionCode] = it.value;
  res.json({ data: { patientId: patient.id, answers: map } });
}
