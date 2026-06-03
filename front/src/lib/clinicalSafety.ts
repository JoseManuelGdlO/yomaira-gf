export type ClinicalSafetyAlertType =
  | "allergy_conflict"
  | "systemic_precaution"
  | "dose_suggestion"
  | "missing_weight";

export type ClinicalSafetySeverity = "critical" | "warning" | "info";

export type ClinicalSafetyContext = "prescription" | "procedure";

export type ClinicalSafetyAlert = {
  type: ClinicalSafetyAlertType;
  severity: ClinicalSafetySeverity;
  message: string;
  medication?: string;
  suggestedDose?: string;
};

export type ClinicalSafetyReport = {
  alerts: ClinicalSafetyAlert[];
  hasCritical: boolean;
};

export type PrescriptionItemInput = {
  medication: string;
  dose?: string;
  frequency?: string;
  duration?: string;
};

export function alertSeverityClass(severity: ClinicalSafetySeverity): string {
  switch (severity) {
    case "critical":
      return "bg-destructive/10 border-destructive/40 text-destructive";
    case "warning":
      return "bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-100";
    default:
      return "bg-sky-500/10 border-sky-500/40 text-sky-950 dark:text-sky-100";
  }
}

export function alertSeverityLabel(severity: ClinicalSafetySeverity): string {
  switch (severity) {
    case "critical":
      return "Crítica";
    case "warning":
      return "Precaución";
    default:
      return "Información";
  }
}

export function doseSuggestionForMedication(
  report: ClinicalSafetyReport | undefined,
  medication: string,
): ClinicalSafetyAlert | undefined {
  if (!report || !medication.trim()) return undefined;
  const norm = medication.trim().toLowerCase();
  return report.alerts.find((a) => {
    if (a.type !== "dose_suggestion" || !a.medication) return false;
    const m = a.medication.trim().toLowerCase();
    return m === norm || norm.includes(m) || m.includes(norm);
  });
}

export function nonDoseAlerts(report: ClinicalSafetyReport | undefined): ClinicalSafetyAlert[] {
  if (!report) return [];
  return report.alerts.filter((a) => a.type !== "dose_suggestion");
}
