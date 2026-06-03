import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ensureAnyPermission } from "@/lib/auth-guard";
import { useState, useMemo } from "react";
import { z } from "zod";
import { useStore } from "@/lib/store";
import { useMedications } from "@/lib/hooks";
import { useClinicalSafety } from "@/lib/useClinicalSafety";
import { type PrescriptionItem } from "@/mocks/data";
import { PatientAvatar } from "@/components/clinical/PatientAvatar";
import { PrescriptionPreview } from "@/components/prescription/PrescriptionPreview";
import { ClinicalSafetyAlerts } from "@/components/clinical/ClinicalSafetyAlerts";
import { PediatricDoseHint } from "@/components/clinical/PediatricDoseHint";
import { Check, Plus, Printer, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({ patientId: z.string().optional() });

export const Route = createFileRoute("/_app/recetas/nueva")({
  head: () => ({ meta: [{ title: "Nueva receta — MediFlow" }] }),
  beforeLoad: () => ensureAnyPermission("prescriptions.write"),
  validateSearch: searchSchema,
  component: NuevaReceta,
});

function NuevaReceta() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { patients, addPrescription } = useStore();
  const MEDICATIONS = useMedications();
  const [step, setStep] = useState(search.patientId ? 2 : 1);
  const [patientId, setPatientId] = useState<string | undefined>(search.patientId);
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [indications, setIndications] = useState("");

  const patient = patients.find((p) => p.id === patientId);
  const safetyItems = useMemo(
    () => items.map(({ medication, dose, frequency, duration }) => ({ medication, dose, frequency, duration })),
    [items],
  );
  const { report: safetyReport, isLoading: safetyLoading } = useClinicalSafety(
    patient?.id,
    "prescription",
    patient && step >= 2 ? safetyItems : undefined,
  );

  const addItem = () => setItems([...items, { medication: "", dose: "", frequency: "", duration: "" }]);
  const updateItem = (i: number, patch: Partial<PrescriptionItem>) => setItems(items.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const finalize = async () => {
    if (!patient) return;
    try {
      const { warnings } = await addPrescription({
        id: "rx" + Date.now(),
        patientId: patient.id,
        date: new Date().toISOString().slice(0, 10),
        items,
        indications,
        diagnosis,
      });
      toast.success("Receta guardada");
      const critical = warnings.filter((w) => w.severity === "critical");
      if (critical.length > 0) {
        toast.warning(critical[0]!.message, { duration: 8000 });
      }
      navigate({ to: "/recetas" });
    } catch {
      toast.error("No se pudo guardar la receta");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Nueva receta</h1>
        <p className="text-muted-foreground text-sm mt-1">Genera una receta médica imprimible</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 no-print">
        {["Paciente", "Medicamentos", "Vista previa"].map((label, i) => {
          const n = i + 1;
          const active = step === n; const done = step > n;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`h-8 w-8 rounded-full grid place-items-center text-sm font-semibold ${done ? "bg-success text-white" : active ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"}`}>
                {done ? <Check className="h-4 w-4" /> : n}
              </div>
              <span className={`text-sm ${active ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
              {i < 2 && <div className="flex-1 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div className="bg-card border rounded-2xl p-6 no-print">
          <h2 className="font-display text-lg font-semibold mb-4">Selecciona paciente</h2>
          <div className="grid sm:grid-cols-2 gap-2 max-h-[500px] overflow-auto">
            {patients.map((p) => (
              <button key={p.id} onClick={() => { setPatientId(p.id); setStep(2); }} className={`flex items-center gap-3 p-3 rounded-xl border text-left hover:bg-surface ${patientId === p.id ? "border-primary bg-primary/5" : ""}`}>
                <PatientAvatar patient={p} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.age} años</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && patient && (
        <div className="bg-card border rounded-2xl p-6 no-print space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b">
            <PatientAvatar patient={patient} />
            <div>
              <div className="font-medium">{patient.name}</div>
              <div className="text-xs text-muted-foreground">
                {patient.age} años
                {patient.weightKg != null ? ` · ${patient.weightKg} kg` : ""}
                {" · "}
                {patient.allergies.length > 0 ? `Alergias: ${patient.allergies.join(", ")}` : "Sin alergias"}
              </div>
            </div>
          </div>

          <ClinicalSafetyAlerts report={safetyReport} loading={safetyLoading} />

          <div>
            <label className="text-sm font-medium">Diagnóstico</label>
            <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Ej. Faringoamigdalitis aguda" className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Medicamentos</label>
              <button onClick={addItem} className="inline-flex items-center gap-1 text-sm text-primary font-medium"><Plus className="h-4 w-4" /> Agregar</button>
            </div>
            <div className="space-y-3">
              {items.map((it, i) => (
                <div key={i} className="bg-surface rounded-xl p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <input list="med-list-page" value={it.medication} onChange={(e) => updateItem(i, { medication: e.target.value })} placeholder="Medicamento y presentación" className="sm:col-span-4 h-9 px-2 rounded-lg bg-card border text-sm" />
                  <input value={it.dose} onChange={(e) => updateItem(i, { dose: e.target.value })} placeholder="Dosis (ej. 5 ml)" className="sm:col-span-2 h-9 px-2 rounded-lg bg-card border text-sm" />
                  <input value={it.frequency} onChange={(e) => updateItem(i, { frequency: e.target.value })} placeholder="Frecuencia" className="sm:col-span-3 h-9 px-2 rounded-lg bg-card border text-sm" />
                  <input value={it.duration} onChange={(e) => updateItem(i, { duration: e.target.value })} placeholder="Duración" className="sm:col-span-2 h-9 px-2 rounded-lg bg-card border text-sm" />
                  <button onClick={() => removeItem(i)} className="sm:col-span-1 p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                  <PediatricDoseHint medication={it.medication} report={safetyReport} />
                </div>
              ))}
              <datalist id="med-list-page">
                {MEDICATIONS.map((m) => <option key={m.name} value={`${m.name} ${m.presentation}`} />)}
              </datalist>
              {items.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">Agrega al menos un medicamento.</div>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Indicaciones</label>
            <textarea value={indications} onChange={(e) => setIndications(e.target.value)} rows={3} placeholder="Indicaciones generales para el paciente..." className="mt-1 w-full p-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring resize-y" />
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Cambiar paciente</button>
            <button onClick={() => setStep(3)} disabled={items.length === 0} className="inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50">Vista previa <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {step === 3 && patient && (
        <div className="space-y-4">
          <div className="flex items-center justify-between no-print">
            <button onClick={() => setStep(2)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Editar</button>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-card border rounded-xl px-4 py-2 text-sm font-medium hover:bg-surface"><Printer className="h-4 w-4" /> Imprimir</button>
              <button onClick={finalize} className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:bg-primary/90">Guardar receta</button>
            </div>
          </div>
          <PrescriptionPreview rx={{ id: "preview", patientId: patient.id, date: new Date().toISOString().slice(0, 10), items, indications, diagnosis }} patient={patient} />
        </div>
      )}
    </div>
  );
}
