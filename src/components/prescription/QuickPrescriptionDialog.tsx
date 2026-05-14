import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { MEDICATIONS, type PrescriptionItem } from "@/mocks/data";
import { PrescriptionPreview } from "./PrescriptionPreview";
import { PatientAvatar } from "@/components/clinical/PatientAvatar";
import { Pill, Plus, Printer, Trash2, Eye, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { todayISO } from "@/lib/format";

export function QuickPrescriptionDialog({ patientId, open, onOpenChange }: { patientId: string | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { patients, addPrescription } = useStore();
  const patient = patients.find((p) => p.id === patientId);
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [indications, setIndications] = useState("");
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (open) { setItems([]); setDiagnosis(""); setIndications(""); setPreview(false); }
  }, [open, patientId]);

  if (!patient) return null;

  const addItem = () => setItems([...items, { medication: `${MEDICATIONS[0].name} ${MEDICATIONS[0].presentation}`, dose: "5 ml", frequency: "cada 8 horas", duration: "5 días" }]);
  const updateItem = (i: number, patch: Partial<PrescriptionItem>) => setItems(items.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const save = () => {
    if (items.length === 0) return toast.error("Agrega al menos un medicamento");
    addPrescription({
      id: "rx" + Date.now(), patientId: patient.id, date: todayISO(),
      items, indications, diagnosis,
    });
    toast.success("Receta guardada");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl">Nueva receta</DialogTitle>
              <DialogDescription>Genera y previsualiza una receta médica imprimible</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Patient banner */}
        <div className="flex items-center gap-3 bg-surface rounded-xl p-3">
          <PatientAvatar patient={patient} />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{patient.name}</div>
            <div className="text-xs text-muted-foreground">
              {patient.age} años · {patient.allergies.length > 0 ? `Alergias: ${patient.allergies.join(", ")}` : "Sin alergias"}
            </div>
          </div>
        </div>

        {!preview ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Diagnóstico</label>
              <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Ej. Caries en molar 64" className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Medicamentos</label>
                <button onClick={addItem} className="inline-flex items-center gap-1 text-sm text-primary font-medium"><Plus className="h-4 w-4" /> Agregar</button>
              </div>
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="bg-surface rounded-xl p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <select value={it.medication} onChange={(e) => updateItem(i, { medication: e.target.value })} className="sm:col-span-4 h-9 px-2 rounded-lg bg-card border text-sm">
                      {MEDICATIONS.map((m) => <option key={m.name} value={`${m.name} ${m.presentation}`}>{m.name} — {m.presentation}</option>)}
                    </select>
                    <input value={it.dose} onChange={(e) => updateItem(i, { dose: e.target.value })} placeholder="Dosis" className="sm:col-span-2 h-9 px-2 rounded-lg bg-card border text-sm" />
                    <input value={it.frequency} onChange={(e) => updateItem(i, { frequency: e.target.value })} placeholder="Frecuencia" className="sm:col-span-3 h-9 px-2 rounded-lg bg-card border text-sm" />
                    <input value={it.duration} onChange={(e) => updateItem(i, { duration: e.target.value })} placeholder="Duración" className="sm:col-span-2 h-9 px-2 rounded-lg bg-card border text-sm" />
                    <button onClick={() => removeItem(i)} className="sm:col-span-1 p-2 text-destructive hover:bg-destructive/10 rounded-lg justify-self-end"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                {items.length === 0 && <div className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-xl">Sin medicamentos. Agrega uno para comenzar.</div>}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Indicaciones</label>
              <textarea value={indications} onChange={(e) => setIndications(e.target.value)} rows={3} placeholder="Indicaciones generales para el paciente..." className="mt-1 w-full p-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring resize-y" />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg text-sm font-medium border bg-card hover:bg-surface">Cancelar</button>
              <button onClick={() => setPreview(true)} disabled={items.length === 0} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-card hover:bg-surface disabled:opacity-50">
                <Eye className="h-4 w-4" /> Vista previa
              </button>
              <button onClick={save} disabled={items.length === 0} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Guardar</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <PrescriptionPreview rx={{ id: "preview", patientId: patient.id, date: todayISO(), items, indications, diagnosis }} patient={patient} />
            <div className="flex justify-between gap-2 pt-2 border-t no-print">
              <button onClick={() => setPreview(false)} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Editar</button>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-card hover:bg-surface"><Printer className="h-4 w-4" /> Imprimir</button>
                <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">Guardar receta</button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
