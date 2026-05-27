import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { PatientAvatar } from "./PatientAvatar";
import { Stethoscope } from "lucide-react";
import { toast } from "sonner";
import type { Appointment, Patient } from "@/mocks/data";

export function CompleteAppointmentDialog({
  appointment,
  patient,
  open,
  onOpenChange,
}: {
  appointment: Appointment | null;
  patient: Patient | undefined;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { branding } = useBranding();
  const { user } = useAuth();
  const qc = useQueryClient();
  const brandingId = user?.brandingId;

  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [nextTreatment, setNextTreatment] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [nextAppointment, setNextAppointment] = useState("");
  const [evolutionNote, setEvolutionNote] = useState("");

  useEffect(() => {
    if (open && appointment) {
      setDiagnosis("");
      setTreatment("");
      setNextTreatment("");
      setPaymentAmount("");
      setPaymentMethod("");
      setNextAppointment("");
      setEvolutionNote("");
    }
  }, [open, appointment]);

  const completeM = useMutation({
    mutationFn: () => {
      const paymentParts = [paymentAmount.trim(), paymentMethod.trim()].filter(Boolean);
      const paymentAndNextAppointment = [
        paymentParts.length ? `Pago: ${paymentParts.join(" — ")}` : "",
        nextAppointment.trim() ? `Próxima cita: ${nextAppointment.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      return api.appointments.complete(appointment!.id, {
        diagnosis: diagnosis.trim(),
        treatment: treatment.trim(),
        nextTreatment: nextTreatment.trim(),
        paymentAndNextAppointment,
        evolutionNote: evolutionNote.trim(),
        notes: evolutionNote.trim(),
        doctor: branding.doctorName,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKey(["consultations"], brandingId) });
      qc.invalidateQueries({ queryKey: tenantKey(["appointments"], brandingId) });
      qc.invalidateQueries({ queryKey: tenantKey(["patients"], brandingId) });
      toast.success("Consulta registrada en la hoja clínica");
      onOpenChange(false);
    },
    onError: () => toast.error("No se pudo completar la cita"),
  });

  if (!appointment || !patient) return null;

  const submit = () => {
    if (!diagnosis.trim() || !treatment.trim()) {
      return toast.error("Captura diagnóstico y tratamiento realizado");
    }
    completeM.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl">Registrar visita</DialogTitle>
              <DialogDescription>
                Se añadirá una fila a la hoja clínica. También puedes registrar visitas desde el expediente sin cita.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-3 bg-surface rounded-xl p-3">
          <PatientAvatar patient={patient} />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{patient.name}</div>
            <div className="text-xs text-muted-foreground">
              {appointment.date} · {appointment.time} · {appointment.reason}
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-2">
          <Field label="Tratamiento realizado *" value={treatment} onChange={setTreatment} placeholder="Ej. Resina compuesta, fluorización" />
          <Field label="Próximo tratamiento" value={nextTreatment} onChange={setNextTreatment} placeholder="Ej. Corona en 64" />
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
              rows={3}
              placeholder="Observaciones del paciente en esta visita…"
              className="mt-1 w-full p-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
            />
          </div>
          <Field label="Diagnóstico *" value={diagnosis} onChange={setDiagnosis} placeholder="Ej. Caries en molar 64" />
        </div>

        <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row sm:items-center">
          <Link
            to="/pacientes/$id"
            params={{ id: patient.id }}
            search={{}}
            onClick={() => onOpenChange(false)}
            className="text-sm text-primary font-medium hover:underline sm:mr-auto order-last sm:order-first"
          >
            Ver hoja clínica →
          </Link>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg text-sm font-medium border bg-card hover:bg-surface">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={completeM.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            Guardar y completar
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
