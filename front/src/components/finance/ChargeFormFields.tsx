import type { PaymentMethod } from "@/mocks/data";
import { PAYMENT_METHODS } from "@/lib/finance";

export function ChargeFormFields({
  amount,
  paymentMethod,
  chargeNote,
  onAmountChange,
  onPaymentMethodChange,
  onChargeNoteChange,
}: {
  amount: string;
  paymentMethod: PaymentMethod | "";
  chargeNote: string;
  onAmountChange: (v: string) => void;
  onPaymentMethodChange: (v: PaymentMethod | "") => void;
  onChargeNoteChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border bg-surface/50 p-3">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cobro</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Monto</label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="Ej. 800"
            className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Método de pago</label>
          <select
            value={paymentMethod}
            onChange={(e) => onPaymentMethodChange(e.target.value as PaymentMethod | "")}
            className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Seleccionar…</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Nota del cobro / tratamiento</label>
        <textarea
          value={chargeNote}
          onChange={(e) => onChargeNoteChange(e.target.value)}
          rows={2}
          placeholder="Motivo del cobro o tratamiento realizado…"
          className="mt-1 w-full p-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
        />
      </div>
    </div>
  );
}
