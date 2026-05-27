import { Request, Response } from 'express';
import { z } from 'zod';
import { PatientDentalChart } from '../models/PatientDentalChart';
import type { DentitionType, FranklScale } from '../models/PatientDentalChart';
import { findTenantPatient } from '../middleware/tenant';

const franklEnum = z.enum(['na', 'I', 'II', 'III', 'IV']);
const dentitionEnum = z.enum(['temporal', 'mixta', 'permanente']);

export const upsertSchema = z.object({
  toothTreatments: z.record(z.string(), z.string()).optional(),
  frankl: franklEnum.optional(),
  dentition: z.array(dentitionEnum).optional(),
  atm: z.string().optional(),
  ganglios: z.string().optional(),
  softTissues: z.string().optional(),
  frenula: z.string().optional(),
});

const defaultChart = {
  toothTreatments: {} as Record<string, string>,
  frankl: 'na' as FranklScale,
  dentition: [] as DentitionType[],
  atm: '',
  ganglios: '',
  softTissues: '',
  frenula: '',
};

export async function getForPatient(req: Request, res: Response): Promise<void> {
  const patient = await findTenantPatient(req, req.params.id);
  let chart = await PatientDentalChart.findOne({ where: { patientId: patient.id } });
  if (!chart) {
    chart = await PatientDentalChart.create({
      patientId: patient.id,
      brandingId: req.user!.brandingId,
      ...defaultChart,
    });
  }
  res.json({ data: chart });
}

export async function upsertForPatient(req: Request, res: Response): Promise<void> {
  const patient = await findTenantPatient(req, req.params.id);
  const body = req.body as z.infer<typeof upsertSchema>;

  let chart = await PatientDentalChart.findOne({ where: { patientId: patient.id } });
  if (!chart) {
    chart = await PatientDentalChart.create({
      patientId: patient.id,
      brandingId: req.user!.brandingId,
      ...defaultChart,
      ...body,
    });
  } else {
    await chart.update(body);
  }
  res.json({ data: chart });
}
