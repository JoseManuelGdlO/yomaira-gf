import { NotificationLog } from '../../models';

export async function logNotification(opts: {
  appointmentId?: string;
  eventType: string;
  channel: string;
  recipient: string;
  status: 'sent' | 'failed' | 'skipped';
  errorMessage?: string;
}): Promise<void> {
  try {
    await NotificationLog.create({
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
