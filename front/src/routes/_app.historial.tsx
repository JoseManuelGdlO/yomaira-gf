import { createFileRoute } from "@tanstack/react-router";
import { fmtLong } from "@/lib/format";
import { useStore } from "@/lib/store";
import { ClinicalTimeline } from "@/components/clinical/ClinicalTimeline";

export const Route = createFileRoute("/_app/historial")({
  head: () => ({ meta: [{ title: "Historial médico — MediFlow" }] }),
  component: HistorialPage,
});

function HistorialPage() {
  const { consultations, patients } = useStore();
  const sorted = [...consultations].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Historial médico</h1>
        <p className="text-muted-foreground text-sm mt-1">Todas las consultas registradas</p>
      </div>
      <div className="bg-card border rounded-2xl p-6">
        <div className="space-y-6">
          {sorted.map((c) => {
            const p = patients.find((x) => x.id === c.patientId);
            return (
              <div key={c.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{p?.name}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{fmtLong(c.date)}</span>
                </div>
                <div className="text-sm mt-1"><span className="text-muted-foreground">Tratamiento realizado:</span> {c.treatment}</div>
                {c.nextTreatment && (
                  <div className="text-sm"><span className="text-muted-foreground">Próximo:</span> {c.nextTreatment}</div>
                )}
                {c.paymentAndNextAppointment && (
                  <div className="text-sm"><span className="text-muted-foreground">Pago / cita:</span> {c.paymentAndNextAppointment}</div>
                )}
                <div className="text-sm"><span className="text-muted-foreground">Diagnóstico:</span> {c.diagnosis}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
