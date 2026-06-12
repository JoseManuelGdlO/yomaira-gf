import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Consultation, type PaymentMethod } from "@/lib/api";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { todayISO } from "@/lib/format";
import { toast } from "sonner";
import {
  InventoryUsagePicker,
  toInventoryUsageInputs,
  type SelectedUsage,
} from "@/components/inventory/InventoryUsagePicker";
import { ChargeFormFields } from "@/components/finance/ChargeFormFields";
import { buildChargePayload, buildNextAppointmentField, monthRange } from "@/lib/finance";

type Props = {
  mode: "create" | "edit";
  patientId?: string;
  consultation?: Consultation | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

export function EvolutionEntryDialog({ mode, patientId, consultation, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { user, hasPermission } = useAuth();
  const { branding } = useBranding();
  const brandingId = user?.brandingId;
  const canCharge = hasPermission("finances.write");

  const [date, setDate] = useState(todayISO());
  const [treatment, setTreatment] = useState("");
  const [nextTreatment, setNextTreatment] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [chargeNote, setChargeNote] = useState("");
  const [chargeNoteTouched, setChargeNoteTouched] = useState(false);
  const [nextAppointment, setNextAppointment] = useState("");
  const [evolutionNote, setEvolutionNote] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [inventoryUsages, setInventoryUsages] = useState<SelectedUsage[]>([]);

  const inventoryQ = useQuery({
    queryKey: [...tenantKey(["inventory"], brandingId), "active"],
    queryFn: () => api.inventory.list({ active: true }),
    enabled: open && hasPermission("inventory.read"),
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "create") {
      setDate(todayISO());
      setTreatment("");
      setNextTreatment("");
      setPaymentAmount("");
      setPaymentMethod("");
      setChargeNote("");
      setChargeNoteTouched(false);
      setNextAppointment("");
      setEvolutionNote("");
      setDiagnosis("");
      setInventoryUsages([]);
      return;
    }
    if (consultation) {
      setDate(consultation.date);
      setTreatment(consultation.treatment ?? "");
      setNextTreatment(consultation.nextTreatment ?? "");
      setEvolutionNote(consultation.evolutionNote ?? consultation.notes ?? "");
      setDiagnosis(consultation.diagnosis ?? "");

      if (consultation.charge) {
        setPaymentAmount(String(consultation.charge.amount));
        setPaymentMethod(consultation.charge.paymentMethod);
        setChargeNote(consultation.charge.note ?? "");
        setChargeNoteTouched(true);
      } else {
        const raw = consultation.paymentAndNextAppointment ?? "";
        const payMatch = raw.match(/Pago:\s*([^|]+)/i);
        if (payMatch) {
          const parts = payMatch[1].trim().split(" — ");
          setPaymentAmount(parts[0]?.replace(/[^\d.,]/g, "") ?? "");
          const legacyMethod = parts[1]?.toLowerCase() ?? "";
          const mapped =
            legacyMethod.includes("tarjeta")
              ? "tarjeta"
              : legacyMethod.includes("transfer")
                ? "transferencia"
                : legacyMethod.includes("efectivo")
                  ? "efectivo"
                  : legacyMethod
                    ? "otro"
                    : "";
          setPaymentMethod(mapped as PaymentMethod | "");
        } else {
          setPaymentAmount("");
          setPaymentMethod("");
        }
        setChargeNote(consultation.treatment ?? "");
        setChargeNoteTouched(false);
      }

      const apptMatch = (consultation.paymentAndNextAppointment ?? "").match(/Próxima cita:\s*(.+)/i);
      setNextAppointment(apptMatch?.[1]?.trim() ?? "");

      if (mode !== "edit") return;
      const usages = consultation.inventoryUsages ?? [];
      if (usages.length && inventoryQ.data) {
        setInventoryUsages(
          usages.map((u) => {
            const item = inventoryQ.data!.find((i) => i.id === u.inventoryItemId);
            return {
              inventoryItemId: u.inventoryItemId,
              quantity: u.quantity,
              itemName: u.itemName ?? item?.name ?? "Insumo",
              unit: u.unit ?? item?.unit ?? "unidades",
              available: (item?.quantity ?? 0) + u.quantity,
            };
          }),
        );
      } else if (!usages.length) {
        setInventoryUsages([]);
      }
    }
  }, [open, mode, consultation, inventoryQ.data]);

  useEffect(() => {
    if (!canCharge || chargeNoteTouched) return;
    setChargeNote(treatment);
  }, [treatment, canCharge, chargeNoteTouched]);

  const saveM = useMutation({
    mutationFn: async () => {
      const usagePayload = hasPermission("inventory.read")
        ? { inventoryUsages: toInventoryUsageInputs(inventoryUsages) }
        : {};
      const charge = canCharge ? buildChargePayload(paymentAmount, paymentMethod, chargeNote) : undefined;
      const body = {
        treatment: treatment.trim(),
        nextTreatment: nextTreatment.trim(),
        paymentAndNextAppointment: buildNextAppointmentField(nextAppointment),
        evolutionNote: evolutionNote.trim(),
        diagnosis: diagnosis.trim(),
        notes: evolutionNote.trim(),
        ...usagePayload,
        ...(canCharge ? { charge: charge ?? null } : {}),
      };

      if (mode === "create") {
        return api.consultations.create({
          patientId: patientId!,
          date,
          reason: "Registro en hoja clínica",
          doctor: branding.doctorName,
          ...body,
        });
      }
      return api.consultations.update(consultation!.id, { ...body, date });
    },
    onSuccess: () => {
      const range = monthRange();
      qc.invalidateQueries({ queryKey: tenantKey(["consultations"], brandingId) });
      qc.invalidateQueries({ queryKey: tenantKey(["patients"], brandingId) });
      qc.invalidateQueries({ queryKey: tenantKey(["inventory"], brandingId) });
      qc.invalidateQueries({ queryKey: tenantKey(["finances"], brandingId) });
      qc.invalidateQueries({ queryKey: [...tenantKey(["finances", "summary"], brandingId), range.from, range.to] });
      toast.success(mode === "create" ? "Registro añadido a la hoja clínica" : "Registro actualizado");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message || "No se pudo guardar"),
  });

  const submit = () => {
    const hasContent =
      treatment.trim() ||
      evolutionNote.trim() ||
      nextTreatment.trim() ||
      diagnosis.trim() ||
      paymentAmount.trim() ||
      nextAppointment.trim() ||
      inventoryUsages.length > 0;
    if (!hasContent) {
      return toast.error("Captura al menos un dato del registro");
    }
    saveM.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {mode === "create" ? "Nuevo registro de evolución" : "Editar registro de evolución"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Añade una fila a la hoja clínica sin necesidad de una cita en la agenda."
              : fmtDateLabel(date)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Fecha *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Field label="Tratamiento realizado" value={treatment} onChange={setTreatment} placeholder="Ej. Resina, fluorización" />
          <Field label="Próximo tratamiento" value={nextTreatment} onChange={setNextTreatment} />
          {canCharge && (
            <ChargeFormFields
              amount={paymentAmount}
              paymentMethod={paymentMethod}
              chargeNote={chargeNote}
              onAmountChange={setPaymentAmount}
              onPaymentMethodChange={setPaymentMethod}
              onChargeNoteChange={(v) => {
                setChargeNoteTouched(true);
                setChargeNote(v);
              }}
            />
          )}
          <Field label="Próxima cita" value={nextAppointment} onChange={setNextAppointment} placeholder="Fecha y hora" />
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nota de evolución</label>
            <textarea
              value={evolutionNote}
              onChange={(e) => setEvolutionNote(e.target.value)}
              rows={4}
              placeholder="Observaciones de la visita…"
              className="mt-1 w-full p-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
            />
          </div>
          {hasPermission("inventory.read") && (
            <InventoryUsagePicker
              value={inventoryUsages}
              onChange={setInventoryUsages}
              initialUsages={consultation?.inventoryUsages}
            />
          )}
          <Field label="Diagnóstico" value={diagnosis} onChange={setDiagnosis} />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg text-sm font-medium border bg-card hover:bg-surface">
            Cancelar
          </button>
          <button
            onClick={submit}
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

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function fmtDateLabel(iso: string) {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
