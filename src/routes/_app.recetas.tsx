import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Pill, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/recetas")({
  head: () => ({ meta: [{ title: "Recetas — MedFlow" }] }),
  component: RecetasPage,
});

function RecetasPage() {
  const { prescriptions, patients } = useStore();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold">Recetas</h1>
          <p className="text-muted-foreground text-sm mt-1">{prescriptions.length} recetas emitidas</p>
        </div>
        <Link to="/recetas/nueva" className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/90"><Plus className="h-4 w-4" /> Nueva receta</Link>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prescriptions.map((r) => {
          const p = patients.find((x) => x.id === r.patientId);
          return (
            <div key={r.id} className="bg-card border rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center"><Pill className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p?.name}</div>
                  <div className="text-xs text-muted-foreground">{fmtLong(r.date)}</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground line-clamp-2">{r.diagnosis}</div>
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">{r.items.length} medicamentos</div>
            </div>
          );
        })}
        {prescriptions.length === 0 && <div className="text-sm text-muted-foreground col-span-full text-center py-12">Sin recetas aún.</div>}
      </div>
    </div>
  );
}
