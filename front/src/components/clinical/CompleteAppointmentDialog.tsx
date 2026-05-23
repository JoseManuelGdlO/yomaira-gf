import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { PatientAvatar } from "./PatientAvatar";
import { Stethoscope } from "lucide-react";
import { toast } from "sonner";
import type { Appointment } from "@/mocks/data";

export function CompleteAppointmentDialog({
  appointment, open, onOpenChange,
}: {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { patients, addConsultation, setAppointmentStatus, updatePatient } = useStore();
  const { branding } = useBranding();
  const patient = patients.find((p) => p.id === appointment?.patientId);
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && appointment) {
      setDiagnosis(""); setTreatment(""); setNotes("");
    }
  }, [open, appointment]);

  if (!appointment || !patient) return null;

  const submit = () => {
    if (!diagnosis.trim() || !treatment.trim()) {
      return toast.error("Captura diagnóstico y tratamiento");
    }
    addConsultation({
      id: "c" + Date.now(),
      patientId: patient.id,
      date: appointment.date,
      reason: appointment.reason,
      diagnosis: diagnosis.trim(),
      treatment: treatment.trim(),
      notes: notes.trim(),
      doctor: branding.doctorName,
    });
    setAppointmentStatus(appointment.id, "completada");
    updatePatient(patient.id, { lastVisit: appointment.date });
    toast.success("Consulta registrada en el expediente");
    onOpenChange(false);
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
              <DialogTitle className="font-display text-xl">Registrar consulta</DialogTitle>
              <DialogDescription>Se añadirá al historial clínico del paciente</DialogDescription>
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
          <div>
            <label className="text-xs font-medium text-muted-foreground">Diagnóstico *</label>
            <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Ej. Caries en molar 64" className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tratamiento realizado *</label>
            <input value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="Ej. Resina compuesta, fluorización" className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notas clínicas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Observaciones, recomendaciones, próximos pasos..." className="mt-1 w-full p-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring resize-y" />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg text-sm font-medium border bg-card hover:bg-surface">Cancelar</button>
          <button onClick={submit} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">Guardar y completar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
