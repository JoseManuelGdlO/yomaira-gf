import type { Appointment } from '../../models/Appointment';
import {
  removeAppointmentFromGoogle,
  syncAppointmentToGoogle,
} from '../calendar/googleCalendarService';
import { sendEmail } from './emailService';
import { sendPushToUser } from './pushService';
import {
  buildAppointmentContext,
  eventAllowed,
  getPreferences,
  getStaffRecipients,
  isValidPatientEmail,
} from './recipients';
import { emailContent, pushContent } from './templates';
import type { AppointmentNotificationEvent } from './types';

function mapEvent(status: string, explicit?: AppointmentNotificationEvent): AppointmentNotificationEvent {
  if (explicit) return explicit;
  if (status === 'confirmada') return 'confirmed';
  if (status === 'cancelada') return 'cancelled';
  if (status === 'completada') return 'completed';
  return 'created';
}

export function dispatchAppointmentNotifications(
  appointment: Appointment,
  explicitEvent?: AppointmentNotificationEvent,
  previousStatus?: string,
): void {
  const event =
    explicitEvent ??
    (previousStatus && previousStatus !== appointment.status
      ? mapEvent(appointment.status)
      : mapEvent(appointment.status, 'created'));

  setImmediate(() => {
    runDispatch(appointment, event).catch((e) => console.error('[notifications]', e));
  });
}

async function runDispatch(
  appointment: Appointment,
  event: AppointmentNotificationEvent,
): Promise<void> {
  const ctx = await buildAppointmentContext(appointment);

  const prefEvent =
    event === 'completed' ? 'confirmed' : event === 'created' ? 'created' : event === 'confirmed' ? 'confirmed' : 'cancelled';

  const staff = await getStaffRecipients(ctx.brandingId);

  for (const user of staff) {
    const prefs = await getPreferences(user.userId);
    if (!prefs.emailEnabled && !prefs.pushEnabled) continue;
    if (event !== 'completed' && !eventAllowed(prefs, prefEvent)) continue;

    if (prefs.emailEnabled) {
      const { subject, html, text } = emailContent(event, ctx, 'doctor');
      await sendEmail({
        to: user.email,
        subject,
        html,
        text,
        appointmentId: appointment.id,
        eventType: event,
      });
    }

    if (prefs.pushEnabled) {
      const push = pushContent(event, ctx);
      await sendPushToUser(
        user.userId,
        { ...push, url: '/agenda' },
        { appointmentId: appointment.id, eventType: event },
      );
    }
  }

  if (['confirmed', 'cancelled', 'created'].includes(event) && isValidPatientEmail(ctx.patientEmail)) {
    const { subject, html, text } = emailContent(event, ctx, 'patient');
    await sendEmail({
      to: ctx.patientEmail,
      subject,
      html,
      text,
      appointmentId: appointment.id,
      eventType: event,
    });
  }

  if (event === 'cancelled') {
    await removeAppointmentFromGoogle(appointment.id);
  } else {
    await syncAppointmentToGoogle(appointment.id, ctx);
  }
}
