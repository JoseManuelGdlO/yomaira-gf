import { Request, Response } from 'express';
import { env, isGoogleConfigured } from '../config/env';
import {
  disconnectGoogle,
  getGoogleAuthUrl,
  getGoogleStatus,
  handleGoogleCallback,
} from '../services/calendar/googleCalendarService';

export async function googleConnect(req: Request, res: Response): Promise<void> {
  const url = getGoogleAuthUrl(req.user!.id);
  if (!url) {
    res.status(503).json({
      error: { code: 'GOOGLE_NOT_CONFIGURED', message: 'Google Calendar OAuth is not configured' },
    });
    return;
  }
  res.json({ data: { url } });
}

export async function googleCallback(req: Request, res: Response): Promise<void> {
  const code = req.query.code as string | undefined;
  const userId = req.query.state as string | undefined;
  if (!code || !userId) {
    res.redirect(`${env.FRONTEND_URL}/configuracion?google=error`);
    return;
  }
  try {
    await handleGoogleCallback(code, userId);
    res.redirect(`${env.FRONTEND_URL}/configuracion?google=connected`);
  } catch {
    res.redirect(`${env.FRONTEND_URL}/configuracion?google=error`);
  }
}

export async function googleStatus(req: Request, res: Response): Promise<void> {
  const status = await getGoogleStatus(req.user!.id);
  res.json({
    data: {
      ...status,
      configured: isGoogleConfigured(),
    },
  });
}

export async function googleDisconnect(req: Request, res: Response): Promise<void> {
  await disconnectGoogle(req.user!.id);
  res.status(204).end();
}
