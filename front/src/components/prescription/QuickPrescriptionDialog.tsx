import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useMedications } from "@/lib/hooks";
import { type PrescriptionItem } from "@/mocks/data";
import { PrintPrescriptionPortal } from "./PrintPrescriptionPortal";
import { PrescriptionPreview } from "./PrescriptionPreview";
import { PatientAvatar } from "@/components/clinical/PatientAvatar";
import { Pill, Plus, Printer, Trash2, Eye, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { todayISO } from "@/lib/format";

export function QuickPrescriptionDialog({ patientId, open, onOpenChange }: { patientId: string | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { patients, addPrescription } = useStore();
  const MEDICATIONS = useMedications();
  const [pickedId, setPickedId] = useState<string | null>(patientId);
  const [pickerQ, setPickerQ] = useState("");
  const patient = patients.find((p) => p.id === (patientId ?? pickedId));
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [indications, setIndications] = useState("");
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (open) {
      setItems([]); setDiagnosis(""); setIndications(""); setPreview(false);
      setPickedId(patientId); setPickerQ("");
    }
  }, [open, patientId]);

  const addItem = () => setItems([...items, { medication: "", dose: "", frequency: "", duration: "" }]);
  const updateItem = (i: number, patch: Partial<PrescriptionItem>) => setItems(items.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const save = () => {
    if (!patient) return;
    if (items.length === 0) return toast.error("Agrega al menos un medicamento");
    addPrescription({
      id: "rx" + Date.now(), patientId: patient.id, date: todayISO(),
      items, indications, diagnosis,
    });
    toast.success("Receta guardada");
    onOpenChange(false);
  };

  const filteredPatients = patients.filter((p) => p.name.toLowerCase().includes(pickerQ.toLowerCase()));

  const previewRx = patient
    ? { id: "preview", patientId: patient.id, date: todayISO(), items, indications, diagnosis }
    : null;

  return (
    <>
      {open && preview && previewRx && patient && (
        <PrintPrescriptionPortal rx={previewRx} patient={patient} />
      )}
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

        {!patient ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={pickerQ} onChange={(e) => setPickerQ(e.target.value)} placeholder="Buscar paciente..." className="w-full pl-10 pr-4 h-10 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid sm:grid-cols-2 gap-2 max-h-[420px] overflow-auto">
              {filteredPatients.map((p) => (
                <button key={p.id} onClick={() => setPickedId(p.id)} className="flex items-center gap-3 p-3 rounded-xl border text-left hover:bg-surface">
                  <PatientAvatar patient={p} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.age} años · {p.guardian}</div>
                  </div>
                </button>
              ))}
              {filteredPatients.length === 0 && <div className="text-sm text-muted-foreground col-span-full text-center py-6">Sin resultados.</div>}
            </div>
          </div>
        ) : (
        <>
        <div className="flex items-center gap-3 bg-surface rounded-xl p-3">
          <PatientAvatar patient={patient} />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{patient.name}</div>
            <div className="text-xs text-muted-foreground">
              {patient.age} años · {patient.allergies.length > 0 ? `Alergias: ${patient.allergies.join(", ")}` : "Sin alergias"}
            </div>
          </div>
          {!patientId && (
            <button onClick={() => setPickedId(null)} className="text-xs text-primary font-medium hover:underline">Cambiar</button>
          )}
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
                    <input list="med-list" value={it.medication} onChange={(e) => updateItem(i, { medication: e.target.value })} placeholder="Medicamento y presentación" className="sm:col-span-4 h-9 px-2 rounded-lg bg-card border text-sm" />
                    <input value={it.dose} onChange={(e) => updateItem(i, { dose: e.target.value })} placeholder="Dosis (ej. 5 ml)" className="sm:col-span-2 h-9 px-2 rounded-lg bg-card border text-sm" />
                    <input value={it.frequency} onChange={(e) => updateItem(i, { frequency: e.target.value })} placeholder="Frecuencia" className="sm:col-span-3 h-9 px-2 rounded-lg bg-card border text-sm" />
                    <input value={it.duration} onChange={(e) => updateItem(i, { duration: e.target.value })} placeholder="Duración" className="sm:col-span-2 h-9 px-2 rounded-lg bg-card border text-sm" />
                    <button onClick={() => removeItem(i)} className="sm:col-span-1 p-2 text-destructive hover:bg-destructive/10 rounded-lg justify-self-end"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <datalist id="med-list">
                  {MEDICATIONS.map((m) => <option key={m.name} value={`${m.name} ${m.presentation}`} />)}
                </datalist>
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
            <PrescriptionPreview rx={previewRx!} patient={patient} />
            <div className="flex justify-between gap-2 pt-2 border-t no-print">
              <button onClick={() => setPreview(false)} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Editar</button>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-card hover:bg-surface"><Printer className="h-4 w-4" /> Imprimir</button>
                <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">Guardar receta</button>
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
