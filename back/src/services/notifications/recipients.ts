import { Op } from 'sequelize';
import {
  Branding,
  NotificationPreference,
  Patient,
  Role,
  User,
} from '../../models';
import type { Appointment } from '../../models/Appointment';
import type { AppointmentContext } from './types';

const STAFF_ROLES = ['admin', 'doctor'];

export async function buildAppointmentContext(appointment: Appointment): Promise<AppointmentContext> {
  const patient = await Patient.findByPk(appointment.patientId);
  const branding =
    (await Branding.findOne({ where: { isDefault: true } })) ??
    (await Branding.findOne({ order: [['createdAt', 'ASC']] }));

  return {
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    patientName: patient?.name ?? 'Paciente',
    patientEmail: patient?.email && patient.email !== '—' ? patient.email : null,
    guardian: patient?.guardian ?? '',
    date: appointment.date,
    time: appointment.time,
    reason: appointment.reason,
    status: appointment.status,
    scheduledBy: appointment.scheduledBy,
    clinicName: branding?.clinicName ?? 'Consultorio',
  };
}

export type StaffRecipient = {
  userId: string;
  email: string;
  name: string;
};

export async function getStaffRecipients(): Promise<StaffRecipient[]> {
  const users = await User.findAll({
    where: { active: true },
    include: [
      {
        model: Role,
        through: { attributes: [] },
        where: { name: { [Op.in]: STAFF_ROLES } },
        required: true,
      },
    ],
  });

  return users.map((u) => ({ userId: u.id, email: u.email, name: u.name }));
}

export async function getPreferences(userId: string) {
  let prefs = await NotificationPreference.findOne({ where: { userId } });
  if (!prefs) {
    prefs = await NotificationPreference.create({ userId });
  }
  return prefs;
}

export function eventAllowed(
  prefs: NotificationPreference,
  event: 'created' | 'confirmed' | 'cancelled',
): boolean {
  if (event === 'created') return prefs.onAppointmentCreated;
  if (event === 'confirmed') return prefs.onAppointmentConfirmed;
  return prefs.onAppointmentCancelled;
}

export function isValidPatientEmail(email: string | null): email is string {
  return !!email && email.includes('@') && email !== '—';
}
