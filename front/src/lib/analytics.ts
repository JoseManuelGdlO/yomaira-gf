export type AnalyticsPeriod = "30d" | "90d" | "365d" | "all";

export type RankedItem = { label: string; count: number; pct?: number };

export type ClinicalAnalytics = {
  period: {
    key: AnalyticsPeriod;
    from: string | null;
    to: string;
    previousFrom: string | null;
    previousTo: string | null;
  };
  kpis: {
    consultations: number;
    consultationsDelta: number | null;
    attendanceRate: number | null;
    attendanceRateDelta: number | null;
    recallGapPatients: number;
    recallGapPct: number;
    franklCooperativePct: number | null;
    franklImproving: number;
    franklChallenging: number;
    totalPatients: number;
  };
  series: {
    consultationsByMonth: { month: string; label: string; count: number }[];
  };
  rankings: {
    medications: RankedItem[];
    appointmentReasons: RankedItem[];
    dentalProcedures: RankedItem[];
  };
  distributions: {
    ageGroups: RankedItem[];
    appointmentStatus: RankedItem[];
    frankl: RankedItem[];
  };
  insights: string[];
};

export const ANALYTICS_PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "30d", label: "Últimos 30 días" },
  { value: "90d", label: "Últimos 90 días" },
  { value: "365d", label: "Último año" },
  { value: "all", label: "Todo el historial" },
];

export function formatDelta(delta: number | null, suffix = ""): string {
  if (delta == null) return "";
  if (delta === 0) return "Sin cambio vs periodo anterior";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}${suffix} vs periodo anterior`;
}

export function formatPct(value: number | null): string {
  if (value == null) return "—";
  return `${value}%`;
}
