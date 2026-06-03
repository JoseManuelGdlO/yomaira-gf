import crypto from 'crypto';
import { env } from '../config/env';

function signToken(payload: string): string {
  return crypto.createHmac('sha256', env.PUBLIC_BOOKING_SECRET).update(payload).digest('hex');
}

function verifyToken(expected: string, token: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export function signCancelToken(appointmentId: string): string {
  return signToken(`cancel:${appointmentId}`);
}

export function verifyCancelToken(appointmentId: string, token: string): boolean {
  return verifyToken(signCancelToken(appointmentId), token);
}

export function signConfirmToken(appointmentId: string): string {
  return signToken(`confirm:${appointmentId}`);
}

export function verifyConfirmToken(appointmentId: string, token: string): boolean {
  return verifyToken(signConfirmToken(appointmentId), token);
}
