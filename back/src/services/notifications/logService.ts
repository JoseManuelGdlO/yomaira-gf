import { Appointment, NotificationLog } from '../../models';

export async function logNotification(opts: {
  appointmentId?: string;
  brandingId?: string;
  eventType: string;
  channel: string;
  recipient: string;
  status: 'sent' | 'failed' | 'skipped';
  errorMessage?: string;
}): Promise<void> {
  try {
    let brandingId = opts.brandingId;
    if (!brandingId && opts.appointmentId) {
      const appt = await Appointment.findByPk(opts.appointmentId, { attributes: ['brandingId'] });
      brandingId = appt?.brandingId;
    }
    if (!brandingId) return;

    await NotificationLog.create({
      brandingId,
      appointmentId: opts.appointmentId ?? null,
      eventType: opts.eventType,
      channel: opts.channel,
      recipient: opts.recipient,
      status: opts.status,
      errorMessage: opts.errorMessage ?? null,
    });
  } catch (e) {
    console.error('[notification-log]', e);
  }
}
