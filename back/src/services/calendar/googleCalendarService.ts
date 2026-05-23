import { google } from 'googleapis';
import { env, isGoogleConfigured } from '../../config/env';
import { encrypt, decrypt } from '../../utils/crypto';
import {
  Appointment,
  AppointmentCalendarEvent,
  Branding,
  GoogleCalendarConnection,
} from '../../models';
import type { AppointmentContext } from '../notifications/types';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

function oauth2Client() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
}

export function getGoogleAuthUrl(userId: string): string | null {
  if (!isGoogleConfigured()) return null;
  const client = oauth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: userId,
  });
}

export async function handleGoogleCallback(code: string, userId: string): Promise<void> {
  const client = oauth2Client();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error('Google no devolvió refresh_token. Revoca el acceso e intenta de nuevo.');
  }

  const enc = encrypt(tokens.refresh_token);
  const existing = await GoogleCalendarConnection.findOne({ where: { userId } });
  if (existing) {
    existing.refreshTokenEnc = enc;
    existing.connectedAt = new Date();
    await existing.save();
  } else {
    await GoogleCalendarConnection.create({
      userId,
      refreshTokenEnc: enc,
      calendarId: 'primary',
      connectedAt: new Date(),
    });
  }
}

export async function disconnectGoogle(userId: string): Promise<void> {
  await GoogleCalendarConnection.destroy({ where: { userId } });
  await AppointmentCalendarEvent.destroy({ where: { userId } });
}

export async function getGoogleStatus(userId: string): Promise<{ connected: boolean; calendarId?: string }> {
  const conn = await GoogleCalendarConnection.findOne({ where: { userId } });
  if (!conn) return { connected: false };
  return { connected: true, calendarId: conn.calendarId };
}

async function getCalendarClient(userId: string) {
  const conn = await GoogleCalendarConnection.findOne({ where: { userId } });
  if (!conn) return null;

  const client = oauth2Client();
  client.setCredentials({ refresh_token: decrypt(conn.refreshTokenEnc) });
  const calendar = google.calendar({ version: 'v3', auth: client });
  return { calendar, conn };
}

function eventTimes(date: string, time: string): { start: string; end: string } {
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + 45 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

function eventTitle(ctx: AppointmentContext, status: string): string {
  const prefix =
    status === 'confirmada'
      ? '✓ '
      : status === 'cancelada'
        ? '✗ '
        : status === 'completada'
          ? '✔ '
          : '';
  return `${prefix}Cita: ${ctx.patientName}`;
}

function eventDescription(ctx: AppointmentContext): string {
  return [
    `Paciente: ${ctx.patientName}`,
    `Tutor: ${ctx.guardian}`,
    `Motivo: ${ctx.reason}`,
    `Estado: ${ctx.status}`,
    ctx.scheduledBy === 'patient' ? '(Agendado por paciente en línea)' : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function syncAppointmentToGoogle(
  appointmentId: string,
  ctx: AppointmentContext,
): Promise<void> {
  const connections = await GoogleCalendarConnection.findAll();
  for (const conn of connections) {
    try {
      const client = await getCalendarClient(conn.userId);
      if (!client) continue;

      const { start, end } = eventTimes(ctx.date, ctx.time);
      const existing = await AppointmentCalendarEvent.findOne({
        where: { appointmentId, userId: conn.userId },
      });

      const body = {
        summary: eventTitle(ctx, ctx.status),
        description: eventDescription(ctx),
        start: { dateTime: start, timeZone: 'America/Mexico_City' },
        end: { dateTime: end, timeZone: 'America/Mexico_City' },
      };

      if (existing) {
        await client.calendar.events.update({
          calendarId: client.conn.calendarId,
          eventId: existing.googleEventId,
          requestBody: body,
        });
      } else {
        const res = await client.calendar.events.insert({
          calendarId: client.conn.calendarId,
          requestBody: body,
        });
        if (res.data.id) {
          await AppointmentCalendarEvent.create({
            appointmentId,
            userId: conn.userId,
            googleEventId: res.data.id,
          });
        }
      }
    } catch (e) {
      console.error('[google-calendar]', conn.userId, e);
    }
  }
}

export async function removeAppointmentFromGoogle(appointmentId: string): Promise<void> {
  const mappings = await AppointmentCalendarEvent.findAll({ where: { appointmentId } });
  for (const map of mappings) {
    try {
      const client = await getCalendarClient(map.userId);
      if (!client) continue;
      await client.calendar.events.delete({
        calendarId: client.conn.calendarId,
        eventId: map.googleEventId,
      });
      await map.destroy();
    } catch (e) {
      console.error('[google-calendar-delete]', map.userId, e);
      await map.destroy();
    }
  }
}

export async function buildIcsAttachment(ctx: AppointmentContext, branding?: Branding | null): Promise<string> {
  const { start, end } = eventTimes(ctx.date, ctx.time);
  const uid = `${ctx.appointmentId}@medflow`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dtStart = start.replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dtEnd = end.replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MedFlow//ES',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${eventTitle(ctx, ctx.status)}`,
    `DESCRIPTION:${eventDescription(ctx).replace(/\n/g, '\\n')}`,
    `LOCATION:${branding?.address ?? ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
