import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import { Appointment, Branding, Patient } from '../models';
import { requirePublicSlug, resolveBrandingBySlug } from '../middleware/tenant';
import { dispatchAppointmentNotifications } from '../services/notifications/notificationDispatcher';
import { env } from '../config/env';
import { NotFound } from '../utils/errors';
import crypto from 'crypto';

const WORK_START = 9;
const WORK_END = 18;

function signCancelToken(appointmentId: string): string {
  return crypto
    .createHmac('sha256', env.PUBLIC_BOOKING_SECRET)
    .update(`cancel:${appointmentId}`)
    .digest('hex');
}

export function verifyCancelToken(appointmentId: string, token: string): boolean {
  const expected = signCancelToken(appointmentId);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export async function getBrandingPublic(req: Request, res: Response): Promise<void> {
  const slug = requirePublicSlug(req);
  const branding = await resolveBrandingBySlug(slug);
  res.json({
    data: {
      slug: branding.slug,
      clinicName: branding.clinicName,
      specialty: branding.specialty,
      logoEmoji: branding.logoEmoji,
      phone: branding.phone,
      address: branding.address,
      primary: branding.primary,
      secondary: branding.secondary,
      accent: branding.accent,
      surface: branding.surface,
      sidebar: branding.sidebar,
    },
  });
}

export const lookupPatientSchema = z.object({
  slug: z.string().min(1),
  phone: z.string().min(8),
});

export async function lookupPatient(req: Request, res: Response): Promise<void> {
  const { slug, phone } = req.query as z.infer<typeof lookupPatientSchema>;
  const branding = await resolveBrandingBySlug(slug);
  const normalized = phone.replace(/\D/g, '');
  const patient = await Patient.findOne({
    where: {
      brandingId: branding.id,
      [Op.or]: [
        { guardianPhone: phone },
        { guardianPhone: { [Op.like]: `%${normalized.slice(-10)}%` } },
      ],
    },
  });
  if (!patient) {
    res.json({ data: null });
    return;
  }
  res.json({
    data: {
      id: patient.id,
      name: patient.name,
      guardian: patient.guardian,
      phone: patient.guardianPhone,
    },
  });
}

export const slotsQuerySchema = z.object({
  slug: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function availableSlots(req: Request, res: Response): Promise<void> {
  const { slug, date } = req.query as z.infer<typeof slotsQuerySchema>;
  const branding = await resolveBrandingBySlug(slug);
  const taken = await Appointment.findAll({
    where: { brandingId: branding.id, date, status: { [Op.ne]: 'cancelada' } },
    attributes: ['time'],
  });
  const takenSet = new Set(taken.map((a) => a.time));

  const slots: string[] = [];
  for (let h = WORK_START; h < WORK_END; h++) {
    for (const m of [0, 30]) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      if (!takenSet.has(time)) slots.push(time);
    }
  }
  res.json({ data: slots });
}

export const bookSchema = z.object({
  slug: z.string().min(1),
  patientId: z.string().uuid().optional(),
  name: z.string().min(1).optional(),
  guardian: z.string().min(1).optional(),
  phone: z.string().min(8).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().default('Consulta'),
});

export async function bookAppointment(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof bookSchema>;
  const branding = await resolveBrandingBySlug(body.slug);

  let patientId = body.patientId;
  if (!patientId) {
    if (!body.name || !body.guardian || !body.phone) {
      res.status(400).json({
        error: { code: 'VALIDATION', message: 'Provide patientId or name, guardian and phone' },
      });
      return;
    }
    const patient = await Patient.create({
      brandingId: branding.id,
      name: body.name,
      guardian: body.guardian,
      guardianPhone: body.phone,
      email: '—',
      birthDate: '2000-01-01',
      age: 0,
      gender: 'M',
      bloodType: 'O+',
      allergies: [],
      conditions: [],
      avatarColor: '#B100D4',
      lastVisit: body.date,
    });
    patientId = patient.id;
  } else {
    const patient = await Patient.findOne({ where: { id: patientId, brandingId: branding.id } });
    if (!patient) throw NotFound('Patient not found');
  }

  const conflict = await Appointment.findOne({
    where: { brandingId: branding.id, date: body.date, time: body.time, status: { [Op.ne]: 'cancelada' } },
  });
  if (conflict) {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'Horario no disponible' } });
    return;
  }

  const appointment = await Appointment.create({
    brandingId: branding.id,
    patientId,
    date: body.date,
    time: body.time,
    reason: body.reason,
    status: 'pendiente',
    scheduledBy: 'patient',
  });

  dispatchAppointmentNotifications(appointment, 'created');

  res.status(201).json({
    data: {
      appointment,
      cancelToken: signCancelToken(appointment.id),
    },
  });
}

export async function cancelPublic(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  const token = (req.body as { token?: string }).token ?? (req.query.token as string);
  if (!token || !verifyCancelToken(id, token)) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Token inválido' } });
    return;
  }

  const appointment = await Appointment.findByPk(id);
  if (!appointment) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cita no encontrada' } });
    return;
  }
  if (appointment.status === 'cancelada') {
    res.json({ data: appointment });
    return;
  }

  const prev = appointment.status;
  appointment.status = 'cancelada';
  await appointment.save();
  dispatchAppointmentNotifications(appointment, 'cancelled', prev);

  res.json({ data: appointment });
}
