import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, type FinanceCharge, type PaymentMethod } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { buildChargePayload, monthRange } from "@/lib/finance";
import { ChargeFormFields } from "./ChargeFormFields";
import { toast } from "sonner";
import { todayISO } from "@/lib/format";

export function ChargeDialog({
  open,
  onOpenChange,
  charge,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  charge?: FinanceCharge | null;
}) {
  const { user } = useAuth();
  const brandingId = user?.brandingId;
  const qc = useQueryClient();
  const isEdit = !!charge;

  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [chargeNote, setChargeNote] = useState("");

  const patientsQ = useQuery({
    queryKey: tenantKey(["patients"], brandingId),
    queryFn: () => api.patients.list(),
    enabled: open && !!brandingId,
  });

  useEffect(() => {
    if (!open) return;
    if (charge) {
      setPatientId(charge.patientId);
      setDate(charge.date);
      setAmount(String(charge.amount));
      setPaymentMethod(charge.paymentMethod);
      setChargeNote(charge.note ?? "");
    } else {
      setPatientId("");
      setDate(todayISO());
      setAmount("");
      setPaymentMethod("");
      setChargeNote("");
    }
  }, [open, charge]);

  const saveM = useMutation({
    mutationFn: async () => {
      const payload = buildChargePayload(amount, paymentMethod, chargeNote);
      if (!payload) throw new Error("Captura monto y método de pago");
      if (!patientId) throw new Error("Selecciona un paciente");
      if (isEdit && charge) {
        return api.finances.charges.update(charge.id, {
          patientId,
          date,
          ...payload,
        });
      }
      return api.finances.charges.create({ patientId, date, ...payload });
    },
    onSuccess: () => {
      const range = monthRange();
      qc.invalidateQueries({ queryKey: tenantKey(["finances"], brandingId) });
      qc.invalidateQueries({ queryKey: [...tenantKey(["finances", "charges"], brandingId)] });
      qc.invalidateQueries({ queryKey: [...tenantKey(["finances", "summary"], brandingId), range.from, range.to] });
      toast.success(isEdit ? "Cobro actualizado" : "Cobro registrado");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message || "No se pudo guardar el cobro"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? "Editar cobro" : "Nuevo cobro"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!isEdit && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Paciente *</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seleccionar…</option>
                {(patientsQ.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Fecha *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <ChargeFormFields
            amount={amount}
            paymentMethod={paymentMethod}
            chargeNote={chargeNote}
            onAmountChange={setAmount}
            onPaymentMethodChange={setPaymentMethod}
            onChargeNoteChange={setChargeNote}
          />
        </div>
        <DialogFooter className="gap-2">
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg text-sm font-medium border bg-card hover:bg-surface">
            Cancelar
          </button>
          <button
            onClick={() => saveM.mutate()}
            disabled={saveM.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            Guardar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
