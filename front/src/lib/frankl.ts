export type FranklReadingScale = "I" | "II" | "III" | "IV";

export type FranklTrend = "improving" | "stable" | "declining" | "insufficient";

export type FranklAlertType = "sedation" | "extra_time" | "positive_progress";

export type FranklAlert = {
  type: FranklAlertType;
  message: string;
  severity: "info" | "warning" | "success";
};

export type FranklSummary = {
  latestFrankl: FranklReadingScale | null;
  latestRecordedOn: string | null;
  readingCount: number;
  trend: FranklTrend;
  alerts: FranklAlert[];
  primaryAlert: FranklAlert | null;
};

export type PatientFranklReading = {
  id: string;
  patientId: string;
  brandingId: string;
  frankl: FranklReadingScale;
  recordedOn: string;
  consultationId: string | null;
  appointmentId: string | null;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
};

export type DashboardFranklPatient = {
  patientId: string;
  patientName: string;
  age: number;
  lastVisit: string;
  latestFrankl: FranklReadingScale | null;
  latestRecordedOn: string | null;
  readingCount: number;
  trend: FranklTrend;
  alerts: FranklAlert[];
  primaryAlert: FranklAlert | null;
};

export type DashboardFranklTodayAppointment = {
  appointmentId: string;
  patientId: string;
  patientName: string;
  time: string;
  reason: string;
  status: string;
  franklSummary: FranklSummary;
};

export type DashboardFranklData = {
  counts: {
    sedationAlert: number;
    challengingLatest: number;
    improving: number;
    totalWithReadings: number;
  };
  patients: DashboardFranklPatient[];
  todayAppointments: DashboardFranklTodayAppointment[];
};

export const FRANKL_READING_OPTIONS = [
  { value: "I" as const, label: "I", description: "Definitivamente negativo" },
  { value: "II" as const, label: "II", description: "Negativo" },
  { value: "III" as const, label: "III", description: "Positivo" },
  { value: "IV" as const, label: "IV", description: "Definitivamente positivo" },
];

export function franklToScore(frankl: FranklReadingScale): number {
  const map: Record<FranklReadingScale, number> = { I: 1, II: 2, III: 3, IV: 4 };
  return map[frankl];
}

export function franklBadgeClass(frankl: FranklReadingScale | null | undefined): string {
  switch (frankl) {
    case "I":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "II":
      return "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30";
    case "III":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30";
    case "IV":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function trendLabel(trend: FranklTrend): string {
  switch (trend) {
    case "improving":
      return "En mejora";
    case "declining":
      return "En declive";
    case "stable":
      return "Estable";
    default:
      return "Datos insuficientes";
  }
}

export function trendClass(trend: FranklTrend): string {
  switch (trend) {
    case "improving":
      return "text-emerald-600 dark:text-emerald-400";
    case "declining":
      return "text-destructive";
    case "stable":
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
}

export function alertClass(severity: FranklAlert["severity"]): string {
  switch (severity) {
    case "warning":
      return "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100";
    case "success":
      return "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100";
    default:
      return "bg-muted border-border text-foreground";
  }
}

export function shouldShowFranklBadge(summary: FranklSummary | null | undefined): boolean {
  if (!summary?.latestFrankl) return false;
  return (
    summary.latestFrankl === "I" ||
    summary.latestFrankl === "II" ||
    summary.latestFrankl === "III" ||
    summary.alerts.some((a) => a.type === "sedation" || a.type === "extra_time")
  );
}
