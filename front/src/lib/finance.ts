import type { FinanceChargeInput, PaymentMethod } from "@/mocks/data";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia" },
  { value: "otro", label: "Otro" },
];

export function paymentMethodLabel(method: PaymentMethod | string): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
}

export function parseAmountInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,]/g, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function buildChargePayload(
  amountRaw: string,
  paymentMethod: PaymentMethod | "",
  note: string,
): FinanceChargeInput | null {
  const amount = parseAmountInput(amountRaw);
  if (!amount || !paymentMethod) return null;
  return { amount, paymentMethod, note: note.trim() };
}

export function buildNextAppointmentField(nextAppointment: string): string {
  const trimmed = nextAppointment.trim();
  return trimmed ? `Próxima cita: ${trimmed}` : "";
}

export function formatChargeDisplay(charge?: { amount: number; paymentMethod: string; note?: string } | null): string {
  if (!charge) return "";
  const parts = [formatMoney(charge.amount), paymentMethodLabel(charge.paymentMethod)];
  if (charge.note?.trim()) parts.push(charge.note.trim());
  return parts.join(" — ");
}

export function formatConsultationPaymentColumn(c: {
  charge?: { amount: number; paymentMethod: string; note?: string } | null;
  paymentAndNextAppointment?: string;
}): string {
  const parts: string[] = [];
  if (c.charge) {
    parts.push(formatChargeDisplay(c.charge));
  } else {
    const raw = c.paymentAndNextAppointment ?? "";
    const payMatch = raw.match(/Pago:\s*([^|]+)/i);
    if (payMatch) parts.push(`Pago: ${payMatch[1].trim()}`);
  }
  const apptMatch = (c.paymentAndNextAppointment ?? "").match(/Próxima cita:\s*(.+)/i);
  if (apptMatch) parts.push(`Próxima cita: ${apptMatch[1].trim()}`);
  else if (!c.charge && c.paymentAndNextAppointment && !/Pago:/i.test(c.paymentAndNextAppointment)) {
    parts.push(c.paymentAndNextAppointment);
  }
  return parts.filter(Boolean).join(" | ") || "—";
}

export function monthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toISO(from), to: toISO(to) };
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}
