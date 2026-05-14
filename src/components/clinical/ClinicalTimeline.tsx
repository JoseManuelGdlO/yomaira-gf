import type { Consultation } from "@/mocks/data";
import { Stethoscope } from "lucide-react";

export function ClinicalTimeline({ items }: { items: Consultation[] }) {
  if (items.length === 0) return <div className="text-sm text-muted-foreground py-8 text-center">Sin consultas registradas.</div>;
  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
      {items.map((c) => (
        <div key={c.id} className="relative pb-8 last:pb-0">
          <div className="absolute -left-[18px] top-1 h-4 w-4 rounded-full bg-primary border-4 border-background" />
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{c.reason}</span>
            <span className="text-xs text-muted-foreground ml-auto">{new Date(c.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</span>
          </div>
          <div className="bg-surface rounded-xl border p-4 ml-0">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Diagnóstico</div>
            <div className="text-sm font-medium mt-0.5">{c.diagnosis}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-3">Tratamiento</div>
            <div className="text-sm mt-0.5">{c.treatment}</div>
            {c.notes && (<>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mt-3">Notas</div>
              <div className="text-sm mt-0.5 italic text-muted-foreground">{c.notes}</div>
            </>)}
            <div className="text-xs text-muted-foreground mt-3">— {c.doctor}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
