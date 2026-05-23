import { Request, Response } from 'express';
import { z } from 'zod';
import { NotificationPreference, PushSubscription } from '../models';
import { env, isPushConfigured } from '../config/env';

export async function getPreferences(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  let prefs = await NotificationPreference.findOne({ where: { userId } });
  if (!prefs) {
    prefs = await NotificationPreference.create({ userId });
  }
  res.json({
    data: {
      emailEnabled: prefs.emailEnabled,
      pushEnabled: prefs.pushEnabled,
      onAppointmentCreated: prefs.onAppointmentCreated,
      onAppointmentConfirmed: prefs.onAppointmentConfirmed,
      onAppointmentCancelled: prefs.onAppointmentCancelled,
      pushConfigured: isPushConfigured(),
      vapidPublicKey: env.VAPID_PUBLIC_KEY ?? null,
    },
  });
}

export const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  onAppointmentCreated: z.boolean().optional(),
  onAppointmentConfirmed: z.boolean().optional(),
  onAppointmentCancelled: z.boolean().optional(),
});

export async function updatePreferences(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  let prefs = await NotificationPreference.findOne({ where: { userId } });
  if (!prefs) {
    prefs = await NotificationPreference.create({ userId, ...req.body });
  } else {
    await prefs.update(req.body);
    await prefs.reload();
  }
  res.json({
    data: {
      emailEnabled: prefs.emailEnabled,
      pushEnabled: prefs.pushEnabled,
      onAppointmentCreated: prefs.onAppointmentCreated,
      onAppointmentConfirmed: prefs.onAppointmentConfirmed,
      onAppointmentCancelled: prefs.onAppointmentCancelled,
      pushConfigured: isPushConfigured(),
      vapidPublicKey: env.VAPID_PUBLIC_KEY ?? null,
    },
  });
}

export const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function subscribePush(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof subscribeSchema>;
  const userId = req.user!.id;
  const ua = req.headers['user-agent']?.slice(0, 500) ?? null;

  const existing = await PushSubscription.findOne({
    where: { userId, endpoint: body.endpoint },
  });
  if (existing) {
    await existing.update({ p256dh: body.keys.p256dh, auth: body.keys.auth, userAgent: ua });
  } else {
    await PushSubscription.create({
      userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: ua,
    });
  }
  res.status(201).json({ data: { ok: true } });
}

export const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export async function unsubscribePush(req: Request, res: Response): Promise<void> {
  const { endpoint } = req.body as z.infer<typeof unsubscribeSchema>;
  await PushSubscription.destroy({
    where: { userId: req.user!.id, endpoint },
  });
  res.status(204).end();
}
