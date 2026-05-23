import webpush from 'web-push';
import { env, isPushConfigured } from '../../config/env';
import { PushSubscription } from '../../models';
import { logNotification } from './logService';

let configured = false;

function ensureVapid(): boolean {
  if (!isPushConfigured()) return false;
  if (!configured) {
    webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);
    configured = true;
  }
  return true;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
  meta?: { appointmentId?: string; eventType?: string },
): Promise<void> {
  if (!ensureVapid()) {
    console.log('[push:dev]', userId, payload);
    return;
  }

  const subs = await PushSubscription.findAll({ where: { userId } });
  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/agenda',
  });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        data,
      );
      await logNotification({
        appointmentId: meta?.appointmentId,
        eventType: meta?.eventType ?? 'push',
        channel: 'push',
        recipient: userId,
        status: 'sent',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const statusCode = (e as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await sub.destroy();
      }
      await logNotification({
        appointmentId: meta?.appointmentId,
        eventType: meta?.eventType ?? 'push',
        channel: 'push',
        recipient: userId,
        status: 'failed',
        errorMessage: msg,
      });
    }
  }
}
