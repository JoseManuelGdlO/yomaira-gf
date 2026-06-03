import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import { Appointment, Consultation, Patient, PatientDentalChart, sequelize } from '../models';
import { findTenantPatient, tenantWhere } from '../middleware/tenant';
import { dispatchAppointmentNotifications } from '../services/notifications/notificationDispatcher';
import { isRecordableFrankl, recordFranklReading } from '../services/frankl/recordFranklReading';
import { NotFound } from '../utils/errors';

export const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  patientId: z.string().uuid().optional(),
  status: z.enum(['pendiente', 'confirmada', 'completada', 'cancelada']).optional(),
});

async function findTenantAppointment(req: Request, id: string): Promise<Appointment> {
  const item = await Appointment.findOne({ where: { id, ...tenantWhere(req) } });
  if (!item) throw NotFound('Appointment not found');
  return item;
}

export async function list(req: Request, res: Response): Promise<void> {
  const q = req.query as z.infer<typeof querySchema>;
  const where: Record<string, unknown> = { ...tenantWhere(req) };
  if (q.date) where.date = q.date;
  if (q.patientId) where.patientId = q.patientId;
  if (q.status) where.status = q.status;
  if (q.from && q.to) {
    where.date = { [Op.gte]: q.from, [Op.lte]: q.to };
  } else if (q.from) {
    where.date = { [Op.gte]: q.from };
  } else if (q.to) {
    where.date = { [Op.lte]: q.to };
  }
  const items = await Appointment.findAll({
    where,
    order: [
      ['date', 'ASC'],
      ['time', 'ASC'],
    ],
  });
  res.json({ data: items });
}

export async function get(req: Request, res: Response): Promise<void> {
  const item = await findTenantAppointment(req, req.params.id);
  res.json({ data: item });
}

export const createSchema = z.object({
  patientId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().default(''),
  status: z.enum(['pendiente', 'confirmada', 'completada', 'cancelada']).default('pendiente'),
  scheduledBy: z.enum(['staff', 'patient']).default('staff'),
});

export const updateSchema = createSchema.partial();

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof createSchema>;
  await findTenantPatient(req, body.patientId);
  const item = await Appointment.create({ ...body, brandingId: req.user!.brandingId });
  dispatchAppointmentNotifications(item, 'created');
  if (item.status === 'pendiente') {
    dispatchAppointmentNotifications(item, 'confirmation_requested');
  }
  res.status(201).json({ data: item });
}

export async function update(req: Request, res: Response): Promise<void> {
  const item = await findTenantAppointment(req, req.params.id);
  if (req.body.patientId) await findTenantPatient(req, req.body.patientId);
  await item.update(req.body);
  res.json({ data: item });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const item = await findTenantAppointment(req, req.params.id);
  dispatchAppointmentNotifications(item, 'cancelled', item.status);
  await item.destroy();
  res.status(204).end();
}

export const statusSchema = z.object({
  status: z.enum(['pendiente', 'confirmada', 'completada', 'cancelada']),
});

export async function setStatus(req: Request, res: Response): Promise<void> {
  const item = await findTenantAppointment(req, req.params.id);
  const { status } = req.body as z.infer<typeof statusSchema>;
  const previousStatus = item.status;
  item.status = status;
  await item.save();
  if (status === 'confirmada') {
    dispatchAppointmentNotifications(item, 'confirmed', previousStatus);
  } else if (status === 'cancelada') {
    dispatchAppointmentNotifications(item, 'cancelled', previousStatus);
  } else if (status === 'completada') {
    dispatchAppointmentNotifications(item, 'completed', previousStatus);
  }
  res.json({ data: item });
}

export const completeSchema = z.object({
  diagnosis: z.string().min(1),
  treatment: z.string().min(1),
  notes: z.string().default(''),
  nextTreatment: z.string().default(''),
  paymentAndNextAppointment: z.string().default(''),
  evolutionNote: z.string().default(''),
  doctor: z.string().default(''),
  frankl: z.enum(['I', 'II', 'III', 'IV']).optional(),
});

export async function complete(req: Request, res: Response): Promise<void> {
  const appointment = await findTenantAppointment(req, req.params.id);
  const body = req.body as z.infer<typeof completeSchema>;

  const result = await sequelize.transaction(async (t) => {
    const consultation = await Consultation.create(
      {
        patientId: appointment.patientId,
        date: appointment.date,
        reason: appointment.reason,
        diagnosis: body.diagnosis,
        treatment: body.treatment,
        notes: body.notes,
        nextTreatment: body.nextTreatment,
        paymentAndNextAppointment: body.paymentAndNextAppointment,
        evolutionNote: body.evolutionNote,
        doctor: body.doctor,
      },
      { transaction: t },
    );
    appointment.status = 'completada';
    await appointment.save({ transaction: t });
    await Patient.update(
      { lastVisit: appointment.date },
      { where: { id: appointment.patientId, brandingId: req.user!.brandingId }, transaction: t },
    );

    if (body.frankl && isRecordableFrankl(body.frankl)) {
      let chart = await PatientDentalChart.findOne({
        where: { patientId: appointment.patientId },
        transaction: t,
      });
      if (!chart) {
        chart = await PatientDentalChart.create(
          {
            patientId: appointment.patientId,
            brandingId: req.user!.brandingId,
            toothTreatments: {},
            frankl: body.frankl,
            dentition: [],
            atm: '',
            ganglios: '',
            softTissues: '',
            frenula: '',
          },
          { transaction: t },
        );
      } else {
        await chart.update({ frankl: body.frankl }, { transaction: t });
      }

      await recordFranklReading({
        patientId: appointment.patientId,
        brandingId: req.user!.brandingId,
        frankl: body.frankl,
        recordedOn: appointment.date,
        consultationId: consultation.id,
        appointmentId: appointment.id,
        transaction: t,
      });
    }

    return { consultation, appointment };
  });

  dispatchAppointmentNotifications(result.appointment, 'completed', 'confirmada');
  res.status(201).json({ data: { appointment: result.appointment, consultation: result.consultation } });
}
