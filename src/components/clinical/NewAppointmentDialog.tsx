import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { PatientAvatar } from "./PatientAvatar";
import { CalendarPlus, Search } from "lucide-react";
import { toast } from "sonner";
import { todayISO } from "@/lib/format";
import type { Appointment } from "@/mocks/data";

const REASONS = [
  "Revisión semestral",
  "Limpieza dental",
  "Aplicación de flúor",
  "Sellador de fosetas",
  "Curación / Resina",
  "Extracción",
  "Urgencia",
  "Control post-tratamiento",
];

export function NewAppointmentDialog({
  open, onOpenChange, defaultDate, defaultPatientId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultDate?: string;
  defaultPatientId?: string;
}) {
  const { patients, addAppointment } = useStore();
  const [pickerQ, setPickerQ] = useState("");
  const [patientId, setPatientId] = useState<string | undefined>(defaultPatientId);
  const [date, setDate] = useState(defaultDate ?? todayISO());
  const [time, setTime] = useState("09:00");
  const [reason, setReason] = useState(REASONS[0]);
  const [status, setStatus] = useState<Appointment["status"]>("pendiente");

  useEffect(() => {
    if (open) {
      setPatientId(defaultPatientId);
      setDate(defaultDate ?? todayISO());
      setTime("09:00");
      setReason(REASONS[0]);
      setStatus("pendiente");
      setPickerQ("");
    }
  }, [open, defaultDate, defaultPatientId]);

  const patient = patients.find((p) => p.id === patientId);
  const filtered = patients.filter((p) => p.name.toLowerCase().includes(pickerQ.toLowerCase()));

  const submit = () => {
    if (!patientId) return toast.error("Selecciona un paciente");
    if (!date || !time) return toast.error("Define fecha y hora");
    addAppointment({
      id: "a" + Date.now(),
      patientId, date, time,
      reason: reason.trim() || "Consulta",
      status,
    });
    toast.success("Cita agendada");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl">Nueva cita</DialogTitle>
              <DialogDescription>Agenda una consulta para un paciente</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Patient */}
        {!patient ? (
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground">Paciente *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={pickerQ} onChange={(e) => setPickerQ(e.target.value)} placeholder="Buscar paciente..." className="w-full pl-10 pr-4 h-10 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-auto">
              {filtered.map((p) => (
                <button key={p.id} type="button" onClick={() => setPatientId(p.id)} className="flex items-center gap-3 p-3 rounded-xl border text-left hover:bg-surface">
                  <PatientAvatar patient={p} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.age} años · {p.guardian}</div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && <div className="text-sm text-muted-foreground col-span-full text-center py-6">Sin resultados.</div>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-surface rounded-xl p-3">
            <PatientAvatar patient={patient} />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{patient.name}</div>
              <div className="text-xs text-muted-foreground">{patient.age} años · Tutor: {patient.guardian}</div>
            </div>
            {!defaultPatientId && (
              <button type="button" onClick={() => setPatientId(undefined)} className="text-xs text-primary font-medium hover:underline">Cambiar</button>
            )}
          </div>
        )}

        {/* Schedule */}
        <div className="grid sm:grid-cols-2 gap-4 mt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Fecha *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Hora *</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Motivo</label>
            <input list="reason-list" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo de la consulta" className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
            <datalist id="reason-list">
              {REASONS.map((r) => <option key={r} value={r} />)}
            </datalist>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Estado</label>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["pendiente","confirmada","completada","cancelada"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)} className={`h-10 rounded-lg border text-sm font-medium capitalize ${status === s ? "bg-primary text-primary-foreground border-primary" : "bg-surface"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg text-sm font-medium border bg-card hover:bg-surface">Cancelar</button>
          <button onClick={submit} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">Agendar cita</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
