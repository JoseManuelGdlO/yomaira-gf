import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Search, Plus, AlertCircle, Eye, Pill } from "lucide-react";
import { PatientAvatar } from "@/components/clinical/PatientAvatar";
import { fmtShort } from "@/lib/format";
import { NewPatientDialog } from "@/components/clinical/NewPatientDialog";
import { PatientQuickViewDialog } from "@/components/clinical/PatientQuickViewDialog";
import { QuickPrescriptionDialog } from "@/components/prescription/QuickPrescriptionDialog";

export const Route = createFileRoute("/_app/pacientes")({
  head: () => ({ meta: [{ title: "Pacientes — MedFlow" }] }),
  component: PatientsPage,
});

function PatientsPage() {
  const { patients } = useStore();
  const [q, setQ] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [quickId, setQuickId] = useState<string | null>(null);
  const [rxId, setRxId] = useState<string | null>(null);
  const filtered = patients.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.guardian.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold">Pacientes</h1>
          <p className="text-muted-foreground text-sm mt-1">{patients.length} pacientes registrados</p>
        </div>
        <button onClick={() => setNewOpen(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Nuevo paciente
        </button>
      </div>

      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o tutor..." className="w-full pl-10 pr-4 h-10 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface/60 text-muted-foreground">
              <tr className="text-left">
                <th className="px-6 py-3 font-medium">Paciente</th>
                <th className="px-6 py-3 font-medium">Edad</th>
                <th className="px-6 py-3 font-medium">Tutor</th>
                <th className="px-6 py-3 font-medium">Alergias</th>
                <th className="px-6 py-3 font-medium">Última visita</th>
                <th className="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-3">
                    <Link to="/pacientes/$id" params={{ id: p.id }} className="flex items-center gap-3">
                      <PatientAvatar patient={p} size={36} />
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.gender === "F" ? "Femenino" : "Masculino"} · {p.bloodType}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-3">{p.age} años</td>
                  <td className="px-6 py-3">
                    <div>{p.guardian}</div>
                    <div className="text-xs text-muted-foreground">{p.guardianPhone}</div>
                  </td>
                  <td className="px-6 py-3">
                    {p.allergies.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {p.allergies.map((a) => (
                          <span key={a} className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                            <AlertCircle className="h-3 w-3" /> {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{fmtShort(p.lastVisit)}</td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setQuickId(p.id)} title="Vista rápida" className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => setRxId(p.id)} title="Nueva receta" className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary">
                        <Pill className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Sin resultados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewPatientDialog open={newOpen} onOpenChange={setNewOpen} />
      <PatientQuickViewDialog patientId={quickId} open={!!quickId} onOpenChange={(o) => !o && setQuickId(null)} />
      <QuickPrescriptionDialog patientId={rxId} open={!!rxId} onOpenChange={(o) => !o && setRxId(null)} />
    </div>
  );
}
