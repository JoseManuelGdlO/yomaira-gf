import type { FranklReadingScale } from '../../models/PatientFranklReading';

export type FranklTrend = 'improving' | 'stable' | 'declining' | 'insufficient';

export type FranklAlertType = 'sedation' | 'extra_time' | 'positive_progress';

export type FranklAlert = {
  type: FranklAlertType;
  message: string;
  severity: 'info' | 'warning' | 'success';
};

export type FranklReadingInput = {
  frankl: FranklReadingScale;
  recordedOn: string;
};

export type FranklSummary = {
  latestFrankl: FranklReadingScale | null;
  latestRecordedOn: string | null;
  readingCount: number;
  trend: FranklTrend;
  alerts: FranklAlert[];
  primaryAlert: FranklAlert | null;
};

export function franklToScore(frankl: FranklReadingScale): number {
  const map: Record<FranklReadingScale, number> = { I: 1, II: 2, III: 3, IV: 4 };
  return map[frankl];
}

function avgScore(readings: FranklReadingInput[]): number {
  if (readings.length === 0) return 0;
  return readings.reduce((sum, r) => sum + franklToScore(r.frankl), 0) / readings.length;
}

export function computeFranklTrend(readings: FranklReadingInput[]): FranklTrend {
  if (readings.length < 3) return 'insufficient';
  const sorted = [...readings].sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));
  const firstAvg = avgScore(sorted.slice(0, 2));
  const lastAvg = avgScore(sorted.slice(-2));
  const delta = lastAvg - firstAvg;
  if (delta >= 0.5) return 'improving';
  if (delta <= -0.5) return 'declining';
  return 'stable';
}

export function computeFranklAlerts(readings: FranklReadingInput[]): FranklAlert[] {
  if (readings.length === 0) return [];

  const sorted = [...readings].sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));
  const alerts: FranklAlert[] = [];
  const latest = sorted[sorted.length - 1]!;
  const latestScore = franklToScore(latest.frankl);

  const lastThree = sorted.slice(-3);
  if (lastThree.length >= 3 && lastThree.every((r) => franklToScore(r.frankl) <= 2)) {
    alerts.push({
      type: 'sedation',
      message:
        'Comportamiento negativo persistente (Frankl I–II en las últimas 3 visitas). Considerar técnicas de manejo conductual o evaluar sedación consciente.',
      severity: 'warning',
    });
  }

  const recent = sorted.slice(-3);
  const recentAvg = avgScore(recent);
  const hasVariability =
    recent.length >= 2 && new Set(recent.map((r) => r.frankl)).size > 1;

  if (latest.frankl === 'III' || (recentAvg <= 2.5 && hasVariability)) {
    alerts.push({
      type: 'extra_time',
      message:
        'Reservar tiempo extra en la consulta. El paciente muestra cooperación variable o comportamiento intermedio (Frankl III).',
      severity: 'warning',
    });
  }

  const first = sorted[0]!;
  const improvement = franklToScore(latest.frankl) - franklToScore(first.frankl);
  if (sorted.length >= 2 && improvement >= 1) {
    alerts.push({
      type: 'positive_progress',
      message: `Evolución positiva del comportamiento: de Frankl ${first.frankl} a ${latest.frankl}.`,
      severity: 'success',
    });
  }

  if (latestScore <= 2 && !alerts.some((a) => a.type === 'sedation')) {
    alerts.push({
      type: 'extra_time',
      message: `Última visita con Frankl ${latest.frankl}. Preparar estrategias de contención y tiempo adicional.`,
      severity: 'warning',
    });
  }

  return alerts;
}

export function buildFranklSummary(readings: FranklReadingInput[]): FranklSummary {
  const sorted = [...readings].sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));
  const latest = sorted[sorted.length - 1];
  const alerts = computeFranklAlerts(sorted);
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');

  return {
    latestFrankl: latest?.frankl ?? null,
    latestRecordedOn: latest?.recordedOn ?? null,
    readingCount: sorted.length,
    trend: computeFranklTrend(sorted),
    alerts,
    primaryAlert: warningAlerts[0] ?? alerts[0] ?? null,
  };
}
