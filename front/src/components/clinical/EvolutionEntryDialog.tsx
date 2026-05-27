import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Consultation } from "@/lib/api";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { todayISO } from "@/lib/format";
import { toast } from "sonner";

type Props = {
  mode: "create" | "edit";
  patientId?: string;
  consultation?: Consultation | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

export function EvolutionEntryDialog({ mode, patientId, consultation, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { branding } = useBranding();
  const brandingId = user?.brandingId;

  const [date, setDate] = useState(todayISO());
  const [treatment, setTreatment] = useState("");
  const [nextTreatment, setNextTreatment] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [nextAppointment, setNextAppointment] = useState("");
  const [evolutionNote, setEvolutionNote] = useState("");
  const [diagnosis, setDiagnosis] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode === "create") {
      setDate(todayISO());
      setTreatment("");
      setNextTreatment("");
      setPaymentAmount("");
      setPaymentMethod("");
      setNextAppointment("");
      setEvolutionNote("");
      setDiagnosis("");
      return;
    }
    if (consultation) {
      setDate(consultation.date);
      setTreatment(consultation.treatment ?? "");
      setNextTreatment(consultation.nextTreatment ?? "");
      setEvolutionNote(consultation.evolutionNote ?? consultation.notes ?? "");
      setDiagnosis(consultation.diagnosis ?? "");
      const raw = consultation.paymentAndNextAppointment ?? "";
      const payMatch = raw.match(/Pago:\s*([^|]+)/i);
      const apptMatch = raw.match(/Próxima cita:\s*(.+)/i);
      if (payMatch) {
        const parts = payMatch[1].trim().split(" — ");
        setPaymentAmount(parts[0] ?? "");
        setPaymentMethod(parts[1] ?? "");
      } else if (raw && !apptMatch) {
        setPaymentAmount(raw);
        setPaymentMethod("");
      } else {
        setPaymentAmount("");
        setPaymentMethod("");
      }
      setNextAppointment(apptMatch?.[1]?.trim() ?? "");
    }
  }, [open, mode, consultation]);

  const buildPaymentField = () => {
    const paymentParts = [paymentAmount.trim(), paymentMethod.trim()].filter(Boolean);
    return [
      paymentParts.length ? `Pago: ${paymentParts.join(" — ")}` : "",
      nextAppointment.trim() ? `Próxima cita: ${nextAppointment.trim()}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
  };

  const saveM = useMutation({
    mutationFn: async () => {
      const paymentAndNextAppointment = buildPaymentField();
      const body = {
        treatment: treatment.trim(),
        nextTreatment: nextTreatment.trim(),
        paymentAndNextAppointment,
        evolutionNote: evolutionNote.trim(),
        diagnosis: diagnosis.trim(),
        notes: evolutionNote.trim(),
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
      qc.invalidateQueries({ queryKey: tenantKey(["consultations"], brandingId) });
      qc.invalidateQueries({ queryKey: tenantKey(["patients"], brandingId) });
      toast.success(mode === "create" ? "Registro añadido a la hoja clínica" : "Registro actualizado");
      onOpenChange(false);
    },
    onError: () => toast.error("No se pudo guardar"),
  });

  const submit = () => {
    const hasContent =
      treatment.trim() ||
      evolutionNote.trim() ||
      nextTreatment.trim() ||
      diagnosis.trim() ||
      paymentAmount.trim() ||
      nextAppointment.trim();
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
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Pago (monto)" value={paymentAmount} onChange={setPaymentAmount} placeholder="Ej. $800" />
            <Field label="Método de pago" value={paymentMethod} onChange={setPaymentMethod} placeholder="Efectivo, tarjeta…" />
          </div>
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
