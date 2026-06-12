ssaimport { Op, Transaction } from 'sequelize';
import { Consultation, FinanceCharge, FinanceExpense, Patient } from '../../models';
import type { PaymentMethod } from '../../models/FinanceCharge';

type ChargeWithPatient = FinanceCharge & { patient?: Patient };

export interface ChargeInput {
  amount: number;
  paymentMethod: PaymentMethod;
  note?: string;
}

export function serializeFinanceCharge(charge: ChargeWithPatient) {
  return {
    id: charge.id,
    brandingId: charge.brandingId,
    consultationId: charge.consultationId,
    patientId: charge.patientId,
    date: charge.date,
    amount: Number(charge.amount),
    paymentMethod: charge.paymentMethod, 
    note: charge.note,
    createdBy: charge.createdBy,
    createdAt: charge.createdAt,
    updatedAt: charge.updatedAt,
    patient: charge.patient
      ? { id: charge.patient.id, name: charge.patient.name }
      : undefined,
  };
}

export function serializeFinanceExpense(expense: FinanceExpense) {
  return {
    id: expense.id,
    brandingId: expense.brandingId,
    date: expense.date,
    amount: Number(expense.amount),
    category: expense.category,
    description: expense.description,
    createdBy: expense.createdBy,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

export async function loadChargesForConsultations(
  consultationIds: string[],
): Promise<Map<string, ReturnType<typeof serializeFinanceCharge>>> {
  if (!consultationIds.length) return new Map();
  const charges = await FinanceCharge.findAll({
    where: { consultationId: { [Op.in]: consultationIds } },
  });
  return new Map(
    charges
      .filter((c) => c.consultationId)
      .map((c) => [c.consultationId!, serializeFinanceCharge(c)]),
  );
}

export async function upsertChargeFromConsultation(opts: {
  consultation: Consultation;
  brandingId: string;
  userId: string | undefined;
  charge: ChargeInput | null | undefined;
  transaction: Transaction;
}): Promise<void> {
  const { consultation, brandingId, userId, charge, transaction } = opts;

  const existing = await FinanceCharge.findOne({
    where: { consultationId: consultation.id },
    transaction,
  });

  if (!charge || charge.amount <= 0) {
    if (existing) await existing.destroy({ transaction });
    return;
  }

  const payload = {
    brandingId,
    consultationId: consultation.id,
    patientId: consultation.patientId,
    date: consultation.date,
    amount: charge.amount,
    paymentMethod: charge.paymentMethod,
    note: charge.note ?? '',
    createdBy: userId ?? null,
  };

  if (existing) {
    await existing.update(payload, { transaction });
  } else {
    await FinanceCharge.create(payload, { transaction });
  }
}

export async function deleteChargeForConsultation(
  consultationId: string,
  transaction?: Transaction,
): Promise<void> {
  await FinanceCharge.destroy({ where: { consultationId }, transaction });
}

export async function sumCharges(
  brandingId: string,
  from?: string,
  to?: string,
): Promise<number> {
  const where: Record<string, unknown> = { brandingId };
  if (from && to) where.date = { [Op.gte]: from, [Op.lte]: to };
  else if (from) where.date = { [Op.gte]: from };
  else if (to) where.date = { [Op.lte]: to };

  const result = await FinanceCharge.sum('amount', { where });
  return Number(result ?? 0);
}

export async function sumExpenses(
  brandingId: string,
  from?: string,
  to?: string,
): Promise<number> {
  const where: Record<string, unknown> = { brandingId };
  if (from && to) where.date = { [Op.gte]: from, [Op.lte]: to };
  else if (from) where.date = { [Op.gte]: from };
  else if (to) where.date = { [Op.lte]: to };

  const result = await FinanceExpense.sum('amount', { where });
  return Number(result ?? 0);
}

export async function findChargeWithPatient(
  brandingId: string,
  id: string,
): Promise<FinanceCharge | null> {
  return FinanceCharge.findOne({
    where: { id, brandingId },
    include: [{ model: Patient, as: 'patient', required: false }],
  });
}
