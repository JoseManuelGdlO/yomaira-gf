import { useState } from "react";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import type { ClinicalSafetyAlert, ClinicalSafetySeverity } from "@/lib/clinicalSafety";
import { alertSeverityClass, alertSeverityLabel, nonDoseAlerts } from "@/lib/clinicalSafety";
import type { ClinicalSafetyReport } from "@/lib/clinicalSafety";

function AlertIcon({ severity }: { severity: ClinicalSafetySeverity }) {
  if (severity === "critical") return <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />;
  if (severity === "warning") return <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />;
  return <Info className="h-4 w-4 shrink-0 mt-0.5" />;
}

function AlertRow({ alert }: { alert: ClinicalSafetyAlert }) {
  return (
    <div className={`flex gap-2 rounded-xl border p-3 ${alertSeverityClass(alert.severity)}`}>
      <AlertIcon severity={alert.severity} />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide font-semibold opacity-80">
          {alertSeverityLabel(alert.severity)}
        </div>
        <p className="text-sm leading-snug mt-0.5">{alert.message}</p>
      </div>
    </div>
  );
}

export function ClinicalSafetyAlerts({
  report,
  loading,
  title = "Alertas de seguridad",
  collapsible = true,
}: {
  report: ClinicalSafetyReport | undefined;
  loading?: boolean;
  title?: string;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const alerts = nonDoseAlerts(report);

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-4 animate-pulse h-16" aria-hidden />
    );
  }

  if (!alerts.length) return null;

  const content = (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <AlertRow key={`${alert.type}-${i}`} alert={alert} />
      ))}
    </div>
  );

  if (!collapsible) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {content}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-surface/50"
      >
        <span className="text-sm font-semibold flex items-center gap-2">
          {report?.hasCritical && <ShieldAlert className="h-4 w-4 text-destructive" />}
          {title}
          <span className="text-muted-foreground font-normal">({alerts.length})</span>
        </span>
        <span className="text-xs text-muted-foreground">{open ? "Ocultar" : "Mostrar"}</span>
      </button>
      {open && <div className="px-4 pb-4">{content}</div>}
    </div>
  );
}
