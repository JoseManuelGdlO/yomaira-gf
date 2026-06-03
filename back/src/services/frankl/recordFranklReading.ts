import type { Transaction } from 'sequelize';
import { Op } from 'sequelize';
import { PatientFranklReading, type FranklReadingScale } from '../../models/PatientFranklReading';
import type { FranklScale } from '../../models/PatientDentalChart';

export function isRecordableFrankl(frankl: FranklScale | FranklReadingScale): frankl is FranklReadingScale {
  return frankl !== 'na';
}

export type RecordFranklOptions = {
  patientId: string;
  brandingId: string;
  frankl: FranklReadingScale;
  recordedOn: string;
  consultationId?: string | null;
  appointmentId?: string | null;
  notes?: string;
  transaction?: Transaction;
};

export async function recordFranklReading(opts: RecordFranklOptions): Promise<PatientFranklReading | null> {
  const existing = await PatientFranklReading.findOne({
    where: {
      patientId: opts.patientId,
      recordedOn: opts.recordedOn,
      frankl: opts.frankl,
      ...(opts.consultationId ? { consultationId: opts.consultationId } : {}),
    },
    transaction: opts.transaction,
  });

  if (existing) return existing;

  if (opts.consultationId) {
    const byConsultation = await PatientFranklReading.findOne({
      where: { consultationId: opts.consultationId },
      transaction: opts.transaction,
    });
    if (byConsultation) {
      await byConsultation.update(
        { frankl: opts.frankl, recordedOn: opts.recordedOn, appointmentId: opts.appointmentId ?? null },
        { transaction: opts.transaction },
      );
      return byConsultation;
    }
  }

  const duplicateDay = await PatientFranklReading.findOne({
    where: {
      patientId: opts.patientId,
      recordedOn: opts.recordedOn,
      frankl: opts.frankl,
      consultationId: { [Op.is]: null },
      appointmentId: { [Op.is]: null },
    },
    transaction: opts.transaction,
  });

  if (duplicateDay && !opts.consultationId && !opts.appointmentId) {
    return duplicateDay;
  }

  return PatientFranklReading.create(
    {
      patientId: opts.patientId,
      brandingId: opts.brandingId,
      frankl: opts.frankl,
      recordedOn: opts.recordedOn,
      consultationId: opts.consultationId ?? null,
      appointmentId: opts.appointmentId ?? null,
      notes: opts.notes ?? '',
    },
    { transaction: opts.transaction },
  );
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
