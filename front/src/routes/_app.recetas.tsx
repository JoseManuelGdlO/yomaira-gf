import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { fmtLong } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { Pill, Plus, Eye, Printer } from "lucide-react";
import { QuickPrescriptionDialog } from "@/components/prescription/QuickPrescriptionDialog";
import { ViewPrescriptionDialog } from "@/components/prescription/ViewPrescriptionDialog";
import type { Prescription } from "@/mocks/data";

export const Route = createFileRoute("/_app/recetas")({
  head: () => ({ meta: [{ title: "Recetas — MedFlow" }] }),
  component: RecetasPage,
});

function RecetasPage() {
  const { hasPermission } = useAuth();
  const { prescriptions, patients } = useStore();
  const [newOpen, setNewOpen] = useState(false);
  const [viewRx, setViewRx] = useState<Prescription | null>(null);
  const [autoPrint, setAutoPrint] = useState(false);

  const sorted = [...prescriptions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  const openView = (rx: Prescription) => {
    setAutoPrint(false);
    setViewRx(rx);
  };

  const printRx = (rx: Prescription) => {
    setAutoPrint(true);
    setViewRx(rx);
  };

  const closeView = () => {
    setViewRx(null);
    setAutoPrint(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold">Recetas</h1>
          <p className="text-muted-foreground text-sm mt-1">{prescriptions.length} recetas emitidas</p>
        </div>
        {hasPermission("prescriptions.write") && (
          <button
            onClick={() => setNewOpen(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Nueva receta
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((r) => {
          const p = patients.find((x) => x.id === r.patientId);
          return (
            <div
              key={r.id}
              className="bg-card border rounded-2xl p-5 flex flex-col hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                  <Pill className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p?.name ?? "Paciente"}</div>
                  <div className="text-xs text-muted-foreground">{fmtLong(r.date)}</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground line-clamp-2 flex-1">
                {r.diagnosis || "Sin diagnóstico registrado"}
              </div>
              <div className="mt-3 pt-3 border-t flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{r.items.length} medicamentos</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openView(r)}
                    title="Ver receta"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg px-2.5 py-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" /> Ver
                  </button>
                  <button
                    type="button"
                    onClick={() => printRx(r)}
                    title="Imprimir receta"
                    className="inline-flex items-center gap-1.5 text-xs font-medium border rounded-lg px-2.5 py-1.5 hover:bg-surface"
                  >
                    <Printer className="h-3.5 w-3.5" /> Imprimir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="text-sm text-muted-foreground col-span-full text-center py-12">Sin recetas aún.</div>
        )}
      </div>

      <QuickPrescriptionDialog patientId={null} open={newOpen} onOpenChange={setNewOpen} />
      <ViewPrescriptionDialog
        prescription={viewRx}
        open={!!viewRx}
        onOpenChange={(o) => !o && closeView()}
        autoPrint={autoPrint}
      />
    </div>
  );
}
