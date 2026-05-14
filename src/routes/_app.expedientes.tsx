import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PatientAvatar } from "@/components/clinical/PatientAvatar";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/_app/expedientes")({
  head: () => ({ meta: [{ title: "Expedientes — MedFlow" }] }),
  component: ExpedientesPage,
});

function ExpedientesPage() {
  const { patients, consultations } = useStore();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Expedientes clínicos</h1>
        <p className="text-muted-foreground text-sm mt-1">Acceso rápido a los expedientes activos</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((p) => {
          const count = consultations.filter((c) => c.patientId === p.id).length;
          return (
            <Link key={p.id} to="/pacientes/$id" params={{ id: p.id }} className="bg-card border rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <PatientAvatar patient={p} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.age} años · {p.bloodType}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                <span className="text-muted-foreground inline-flex items-center gap-1.5"><FileText className="h-4 w-4" /> {count} consultas</span>
                <span className="text-primary font-medium">Abrir →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
