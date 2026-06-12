import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type FranklReadingScale, type PaymentMethod } from "@/lib/api";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { PatientAvatar } from "./PatientAvatar";
import { Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { FRANKL_READING_OPTIONS } from "@/lib/frankl";
import { useClinicalSafety } from "@/lib/useClinicalSafety";
import { ClinicalSafetyAlerts } from "@/components/clinical/ClinicalSafetyAlerts";
import {
  InventoryUsagePicker,
  toInventoryUsageInputs,
  type SelectedUsage,
} from "@/components/inventory/InventoryUsagePicker";
import { ChargeFormFields } from "@/components/finance/ChargeFormFields";
import { buildChargePayload, buildNextAppointmentField, monthRange } from "@/lib/finance";
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
  const { user, hasPermission } = useAuth();
  const qc = useQueryClient();
  const brandingId = user?.brandingId;
  const canCharge = hasPermission("finances.write");

  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [nextTreatment, setNextTreatment] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [chargeNote, setChargeNote] = useState("");
  const [chargeNoteTouched, setChargeNoteTouched] = useState(false);
  const [nextAppointment, setNextAppointment] = useState("");
  const [evolutionNote, setEvolutionNote] = useState("");
  const [frankl, setFrankl] = useState<FranklReadingScale | "">("");
  const [inventoryUsages, setInventoryUsages] = useState<SelectedUsage[]>([]);

  const chartQ = useQuery({
    queryKey: tenantKey(["dental-chart", patient?.id ?? ""], brandingId),
    queryFn: () => api.dentalChart.get(patient!.id),
    enabled: open && !!patient?.id,
  });

  useEffect(() => {
    if (open && appointment) {
      setDiagnosis("");
      setTreatment("");
      setNextTreatment("");
      setPaymentAmount("");
      setPaymentMethod("");
      setChargeNote("");
      setChargeNoteTouched(false);
      setNextAppointment("");
      setEvolutionNote("");
      setInventoryUsages([]);
      const current = chartQ.data?.frankl;
      setFrankl(current && current !== "na" ? current : "");
    }
  }, [open, appointment, chartQ.data?.frankl]);

  useEffect(() => {
    if (!canCharge || chargeNoteTouched) return;
    setChargeNote(treatment);
  }, [treatment, canCharge, chargeNoteTouched]);

  const invalidateAfterSave = () => {
    const range = monthRange();
    qc.invalidateQueries({ queryKey: tenantKey(["consultations"], brandingId) });
    qc.invalidateQueries({ queryKey: tenantKey(["appointments"], brandingId) });
    qc.invalidateQueries({ queryKey: tenantKey(["patients"], brandingId) });
    qc.invalidateQueries({ queryKey: tenantKey(["inventory"], brandingId) });
    qc.invalidateQueries({ queryKey: tenantKey(["finances"], brandingId) });
    qc.invalidateQueries({ queryKey: [...tenantKey(["finances", "summary"], brandingId), range.from, range.to] });
    if (patient) {
      qc.invalidateQueries({ queryKey: tenantKey(["dental-chart", patient.id], brandingId) });
      qc.invalidateQueries({ queryKey: tenantKey(["frankl-readings", patient.id], brandingId) });
      qc.invalidateQueries({ queryKey: tenantKey(["frankl-summary", patient.id], brandingId) });
    }
  };

  const completeM = useMutation({
    mutationFn: () => {
      const charge = canCharge ? buildChargePayload(paymentAmount, paymentMethod, chargeNote) : undefined;
      return api.appointments.complete(appointment!.id, {
        diagnosis: diagnosis.trim(),
        treatment: treatment.trim(),
        nextTreatment: nextTreatment.trim(),
        paymentAndNextAppointment: buildNextAppointmentField(nextAppointment),
        evolutionNote: evolutionNote.trim(),
        notes: evolutionNote.trim(),
        doctor: branding.doctorName,
        ...(frankl ? { frankl } : {}),
        ...(hasPermission("inventory.read") && inventoryUsages.length
          ? { inventoryUsages: toInventoryUsageInputs(inventoryUsages) }
          : {}),
        ...(canCharge ? { charge: charge ?? null } : {}),
      });
    },
    onSuccess: () => {
      invalidateAfterSave();
      toast.success("Consulta registrada en la hoja clínica");
      onOpenChange(false);
    },
    onError: () => toast.error("No se pudo completar la cita"),
  });

  if (!appointment || !patient) return null;

  const { report: safetyReport, isLoading: safetyLoading } = useClinicalSafety(
    open ? patient.id : undefined,
    "procedure",
  );

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

        <ClinicalSafetyAlerts report={safetyReport} loading={safetyLoading} title="Precauciones antes del procedimiento" />

        <div className="space-y-3 mt-2">
          <Field label="Tratamiento realizado *" value={treatment} onChange={setTreatment} placeholder="Ej. Resina compuesta, fluorización" />
          <Field label="Próximo tratamiento" value={nextTreatment} onChange={setNextTreatment} placeholder="Ej. Corona en 64" />
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
              rows={3}
              placeholder="Observaciones del paciente en esta visita…"
              className="mt-1 w-full p-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
            />
          </div>
          {hasPermission("inventory.read") && (
            <InventoryUsagePicker value={inventoryUsages} onChange={setInventoryUsages} />
          )}
          <Field label="Diagnóstico *" value={diagnosis} onChange={setDiagnosis} placeholder="Ej. Caries en molar 64" />
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Escala Frankl</label>
            <div className="flex flex-wrap gap-2">
              {FRANKL_READING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFrankl(opt.value)}
                  title={opt.description}
                  className={`min-w-[3rem] px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                    frankl === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-surface hover:bg-accent/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Registra el comportamiento del paciente en esta visita para la evolución clínica.
            </p>
          </div>
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
