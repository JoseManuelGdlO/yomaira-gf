import nodemailer from 'nodemailer';
import { env, isSmtpConfigured } from '../../config/env';
import { logNotification } from './logService';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!isSmtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    });
  }
  return transporter;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  appointmentId?: string;
  eventType?: string;
}): Promise<boolean> {
  const to = opts.to.trim();
  if (!to || !to.includes('@')) {
    await logNotification({
      appointmentId: opts.appointmentId,
      eventType: opts.eventType ?? 'email',
      channel: 'email',
      recipient: to || '(empty)',
      status: 'skipped',
      errorMessage: 'Invalid email',
    });
    return false;
  }

  const tx = getTransporter();
  if (!tx) {
    console.log('[email:dev]', { to, subject: opts.subject, text: opts.text });
    await logNotification({
      appointmentId: opts.appointmentId,
      eventType: opts.eventType ?? 'email',
      channel: 'email',
      recipient: to,
      status: 'sent',
      errorMessage: 'console mode (SMTP not configured)',
    });
    return true;
  }

  try {
    await tx.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM}>`,
      to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    await logNotification({
      appointmentId: opts.appointmentId,
      eventType: opts.eventType ?? 'email',
      channel: 'email',
      recipient: to,
      status: 'sent',
    });
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[email]', msg);
    await logNotification({
      appointmentId: opts.appointmentId,
      eventType: opts.eventType ?? 'email',
      channel: 'email',
      recipient: to,
      status: 'failed',
      errorMessage: msg,
    });
    return false;
  }
}
