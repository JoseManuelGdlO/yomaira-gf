import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { PatientAvatar } from "./PatientAvatar";
import { CalendarPlus, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { todayISO } from "@/lib/format";
import type { Appointment } from "@/mocks/data";

const COLORS = ["#FCE4F5", "#E4E8FC", "#FCE9D6", "#E4FCEA", "#F3E4FC", "#FCEAE4"];

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
  const { patients, addAppointment, addPatient } = useStore();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [pickerQ, setPickerQ] = useState("");
  const [patientId, setPatientId] = useState<string | undefined>(defaultPatientId);
  const [date, setDate] = useState(defaultDate ?? todayISO());
  const [time, setTime] = useState("09:00");
  const [reason, setReason] = useState(REASONS[0]);
  const [status, setStatus] = useState<Appointment["status"]>("pendiente");
  // New patient quick-form
  const [npName, setNpName] = useState("");
  const [npAge, setNpAge] = useState("");
  const [npGuardian, setNpGuardian] = useState("");
  const [npPhone, setNpPhone] = useState("");
  const [npGender, setNpGender] = useState<"F" | "M">("F");

  useEffect(() => {
    if (open) {
      setMode(defaultPatientId ? "existing" : "existing");
      setPatientId(defaultPatientId);
      setDate(defaultDate ?? todayISO());
      setTime("09:00");
      setReason(REASONS[0]);
      setStatus("pendiente");
      setPickerQ("");
      setNpName(""); setNpAge(""); setNpGuardian(""); setNpPhone(""); setNpGender("F");
    }
  }, [open, defaultDate, defaultPatientId]);

  const patient = patients.find((p) => p.id === patientId);
  const filtered = patients.filter((p) => p.name.toLowerCase().includes(pickerQ.toLowerCase()));

  const submit = () => {
    if (!date || !time) return toast.error("Define fecha y hora");
    let usePatientId = patientId;
    if (mode === "new" && !patient) {
      if (!npName.trim() || !npAge || !npGuardian.trim()) {
        return toast.error("Completa nombre, edad y tutor");
      }
      const np = {
        id: "p_" + Date.now(),
        name: npName.trim(),
        age: Number(npAge),
        birthDate: todayISO(),
        gender: npGender,
        guardian: npGuardian.trim(),
        guardianPhone: npPhone || "+52 55 0000 0000",
        email: "—",
        allergies: [],
        conditions: [],
        bloodType: "O+",
        lastVisit: date,
        avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
      addPatient(np);
      usePatientId = np.id;
    }
    if (!usePatientId) return toast.error("Selecciona o registra un paciente");
    addAppointment({
      id: "a" + Date.now(),
      patientId: usePatientId, date, time,
      reason: reason.trim() || "Consulta",
      status,
    });
    toast.success(mode === "new" ? "Paciente registrado y cita agendada" : "Cita agendada");
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
        {!patient && !defaultPatientId && (
          <div className="grid grid-cols-2 gap-2 bg-surface rounded-xl p-1">
            <button type="button" onClick={() => setMode("existing")} className={`h-9 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 ${mode === "existing" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              <Search className="h-4 w-4" /> Paciente existente
            </button>
            <button type="button" onClick={() => setMode("new")} className={`h-9 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 ${mode === "new" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              <UserPlus className="h-4 w-4" /> Paciente nuevo
            </button>
          </div>
        )}

        {!patient && mode === "existing" ? (
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
        ) : !patient && mode === "new" ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Nombre completo *</label>
              <input value={npName} onChange={(e) => setNpName(e.target.value)} placeholder="Sofía Martínez Ruiz" className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Edad *</label>
              <input type="number" min="0" max="120" value={npAge} onChange={(e) => setNpAge(e.target.value)} placeholder="6" className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Género</label>
              <div className="mt-1 flex gap-2">
                {(["F","M"] as const).map((g) => (
                  <button key={g} type="button" onClick={() => setNpGender(g)} className={`flex-1 h-10 rounded-lg border text-sm font-medium ${npGender === g ? "bg-primary text-primary-foreground border-primary" : "bg-surface"}`}>
                    {g === "F" ? "Femenino" : "Masculino"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tutor *</label>
              <input value={npGuardian} onChange={(e) => setNpGuardian(e.target.value)} placeholder="Laura Ruiz" className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Teléfono</label>
              <input value={npPhone} onChange={(e) => setNpPhone(e.target.value)} placeholder="+52 55 1234 5678" className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <p className="sm:col-span-2 text-xs text-muted-foreground">El paciente se registrará al guardar la cita. Podrás completar su expediente después.</p>
          </div>
        ) : patient ? (
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
        ) : null}

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
