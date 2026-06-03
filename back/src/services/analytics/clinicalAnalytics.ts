import { Op } from 'sequelize';
import {
  Appointment,
  Consultation,
  Patient,
  PatientDentalChart,
  PatientFranklReading,
  Prescription,
  PrescriptionItem,
} from '../../models';
import { buildFranklSummary } from '../frankl/franklInsights';

export type AnalyticsPeriod = '30d' | '90d' | '365d' | 'all';

export type RankedItem = { label: string; count: number; pct?: number };

export type ClinicalAnalyticsResult = {
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

const DENTAL_LABELS: Record<string, string> = {
  realizado: 'Tratamiento realizado',
  resina: 'Resina / curación',
  sellador: 'Sellador',
  extraccion: 'Extracción',
  pulpotomia: 'Pulpotomía',
  corona: 'Corona',
  conducto: 'Tratamiento de conductos',
  caries: 'Caries / por tratar',
  ausente: 'Ausente',
  observacion: 'En observación',
};

const AGE_GROUPS = [
  { key: '0-2', label: '0–2 años', min: 0, max: 2 },
  { key: '3-5', label: '3–5 años', min: 3, max: 5 },
  { key: '6-9', label: '6–9 años', min: 6, max: 9 },
  { key: '10-12', label: '10–12 años', min: 10, max: 12 },
  { key: '13+', label: '13+ años', min: 13, max: 999 },
] as const;

const MONTH_NAMES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function resolvePeriod(period: AnalyticsPeriod): {
  from: string | null;
  to: string;
  previousFrom: string | null;
  previousTo: string | null;
} {
  const to = todayISO();
  if (period === 'all') {
    return { from: null, to, previousFrom: null, previousTo: null };
  }
  const days = period === '30d' ? 30 : period === '365d' ? 365 : 90;
  const from = addDays(to, -(days - 1));
  const previousTo = addDays(from, -1);
  const previousFrom = addDays(previousTo, -(days - 1));
  return { from, to, previousFrom, previousTo };
}

function inRange(date: string, from: string | null, to: string): boolean {
  if (from && date < from) return false;
  return date <= to;
}

function topN(map: Map<string, { label: string; count: number }>, n: number, total?: number): RankedItem[] {
  const entries = [...map.values()].sort((a, b) => b.count - a.count).slice(0, n);
  return entries.map((e) => ({
    label: e.label,
    count: e.count,
    pct: total && total > 0 ? Math.round((e.count / total) * 100) : undefined,
  }));
}

function increment(map: Map<string, { label: string; count: number }>, key: string, label: string): void {
  const existing = map.get(key);
  if (existing) {
    existing.count += 1;
  } else {
    map.set(key, { label, count: 1 });
  }
}

function normalizeMedicationKey(raw: string): string {
  return raw.trim().toLowerCase();
}

function displayMedication(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function dentalProcedureLabel(value: string): string {
  const raw = value.trim();
  if (!raw || raw === 'done') return 'Tratamiento realizado';
  if (raw.startsWith('done:')) {
    const text = raw.slice(5).trim();
    return text || 'Tratamiento realizado';
  }
  if (raw.startsWith('plan:')) {
    const text = raw.slice(5).trim();
    return text || 'Tratamiento planificado';
  }
  const colon = raw.indexOf(':');
  if (colon > 0) {
    const code = raw.slice(0, colon);
    const text = raw.slice(colon + 1).trim();
    if (code === 'otro' && text) return text;
    if (text) return text;
    return DENTAL_LABELS[code] ?? text ?? code;
  }
  return DENTAL_LABELS[raw] ?? raw;
}

function dentalProcedureKey(value: string): string {
  const label = dentalProcedureLabel(value);
  return label.trim().toLowerCase();
}

function isToothTreatmentDone(value?: string | null): boolean {
  const raw = value?.trim();
  if (!raw) return false;
  if (raw === 'plan' || raw.startsWith('plan:')) return false;
  if (raw === 'done') return true;
  if (raw.startsWith('done:')) return true;
  return true;
}

function computeAttendanceRate(appointments: Appointment[]): number | null {
  const relevant = appointments.filter((a) => a.status !== 'cancelada');
  if (relevant.length === 0) return null;
  const completed = relevant.filter((a) => a.status === 'completada').length;
  return Math.round((completed / relevant.length) * 100);
}

function monthKey(date: string): string {
  return date.slice(0, 7);
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  const idx = parseInt(m!, 10) - 1;
  return `${MONTH_NAMES[idx]} ${y}`;
}

function last12MonthKeys(to: string): string[] {
  const keys: string[] = [];
  const d = new Date(`${to.slice(0, 7)}-01T12:00:00Z`);
  for (let i = 11; i >= 0; i--) {
    const copy = new Date(d);
    copy.setUTCMonth(copy.getUTCMonth() - i);
    keys.push(`${copy.getUTCFullYear()}-${String(copy.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

function buildInsights(params: {
  kpis: ClinicalAnalyticsResult['kpis'];
  rankings: ClinicalAnalyticsResult['rankings'];
  period: ClinicalAnalyticsResult['period'];
}): string[] {
  const { kpis, rankings, period } = params;
  const insights: string[] = [];

  if (rankings.medications.length > 0) {
    const top = rankings.medications[0]!;
    const pctText = top.pct != null ? ` (${top.pct}% del total)` : '';
    insights.push(`${top.label} es el medicamento más prescrito${pctText} en el periodo seleccionado.`);
  }

  if (kpis.recallGapPatients > 0 && kpis.totalPatients > 0) {
    insights.push(
      `${kpis.recallGapPatients} paciente${kpis.recallGapPatients === 1 ? '' : 's'} (${kpis.recallGapPct}%) llevan más de 6 meses sin control.`,
    );
  }

  if (kpis.attendanceRate != null && kpis.attendanceRateDelta != null && period.previousFrom) {
    const dir = kpis.attendanceRateDelta >= 0 ? 'subió' : 'bajó';
    const pts = Math.abs(kpis.attendanceRateDelta);
    if (pts > 0) {
      insights.push(`La tasa de asistencia ${dir} ${pts} pts vs el periodo anterior (${kpis.attendanceRate}%).`);
    }
  } else if (kpis.attendanceRate != null) {
    insights.push(`Tasa de asistencia del periodo: ${kpis.attendanceRate}%.`);
  }

  if (kpis.consultationsDelta != null && period.previousFrom) {
    const dir = kpis.consultationsDelta >= 0 ? 'aumentaron' : 'disminuyeron';
    insights.push(
      `Las consultas ${dir} ${Math.abs(kpis.consultationsDelta)} respecto al periodo anterior (${kpis.consultations} en total).`,
    );
  }

  if (kpis.franklCooperativePct != null) {
    insights.push(`${kpis.franklCooperativePct}% de lecturas Frankl recientes son cooperativas (III–IV).`);
  }

  if (kpis.franklImproving > 0) {
    insights.push(
      `${kpis.franklImproving} paciente${kpis.franklImproving === 1 ? '' : 's'} muestran mejora en comportamiento (Frankl).`,
    );
  }

  if (rankings.dentalProcedures.length > 0) {
    const top = rankings.dentalProcedures[0]!;
    insights.push(`Procedimiento más frecuente en odontograma: ${top.label} (${top.count} piezas).`);
  }

  if (rankings.appointmentReasons.length > 0) {
    const top = rankings.appointmentReasons[0]!;
    insights.push(`Motivo de cita más común: "${top.label}" (${top.count} citas).`);
  }

  return insights.slice(0, 6);
}

export async function buildClinicalAnalytics(
  brandingId: string,
  periodKey: AnalyticsPeriod = '90d',
): Promise<ClinicalAnalyticsResult> {
  const period = resolvePeriod(periodKey);
  const recallCutoff = addDays(period.to, -180);

  const [
    patients,
    consultations,
    appointments,
    prescriptions,
    franklReadings,
    dentalCharts,
  ] = await Promise.all([
    Patient.findAll({ where: { brandingId }, attributes: ['id', 'age', 'lastVisit', 'allergies'] }),
    Consultation.findAll({
      include: [{ model: Patient, as: 'patient', where: { brandingId }, required: true, attributes: [] }],
      attributes: ['id', 'date', 'treatment'],
    }),
    Appointment.findAll({
      where: { brandingId },
      attributes: ['id', 'date', 'status', 'reason'],
    }),
    Prescription.findAll({
      include: [
        { model: Patient, as: 'patient', where: { brandingId }, required: true, attributes: [] },
        { model: PrescriptionItem, as: 'items', attributes: ['medication'] },
      ],
      attributes: ['id', 'date'],
    }),
    PatientFranklReading.findAll({
      where: { brandingId },
      attributes: ['patientId', 'frankl', 'recordedOn'],
      order: [
        ['recordedOn', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    }),
    PatientDentalChart.findAll({
      where: { brandingId },
      attributes: ['toothTreatments'],
    }),
  ]);

  const totalPatients = patients.length;
  const recallGapPatients = patients.filter((p) => p.lastVisit < recallCutoff).length;
  const recallGapPct = totalPatients > 0 ? Math.round((recallGapPatients / totalPatients) * 100) : 0;

  const consultationsInPeriod = consultations.filter((c) => inRange(c.date, period.from, period.to));
  const consultationsPrev =
    period.previousFrom && period.previousTo
      ? consultations.filter((c) => inRange(c.date, period.previousFrom!, period.previousTo!))
      : [];

  const apptsInPeriod = appointments.filter((a) => inRange(a.date, period.from, period.to));
  const apptsPrev =
    period.previousFrom && period.previousTo
      ? appointments.filter((a) => inRange(a.date, period.previousFrom!, period.previousTo!))
      : [];

  const attendanceRate = computeAttendanceRate(apptsInPeriod);
  const attendanceRatePrev = apptsPrev.length > 0 ? computeAttendanceRate(apptsPrev) : null;
  const attendanceRateDelta =
    attendanceRate != null && attendanceRatePrev != null ? attendanceRate - attendanceRatePrev : null;

  const consultationsDelta =
    period.previousFrom != null ? consultationsInPeriod.length - consultationsPrev.length : null;

  const medMap = new Map<string, { label: string; count: number }>();
  let medTotal = 0;
  for (const rx of prescriptions) {
    if (!inRange(rx.date, period.from, period.to)) continue;
    for (const item of rx.items ?? []) {
      const raw = item.medication?.trim();
      if (!raw) continue;
      const key = normalizeMedicationKey(raw);
      medTotal += 1;
      increment(medMap, key, displayMedication(raw));
    }
  }

  const reasonMap = new Map<string, { label: string; count: number }>();
  for (const a of apptsInPeriod) {
    const raw = a.reason?.trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    increment(reasonMap, key, raw);
  }

  const dentalMap = new Map<string, { label: string; count: number }>();
  for (const chart of dentalCharts) {
    const treatments = chart.toothTreatments ?? {};
    for (const value of Object.values(treatments)) {
      if (!isToothTreatmentDone(value)) continue;
      const key = dentalProcedureKey(value);
      const label = dentalProcedureLabel(value);
      increment(dentalMap, key, label);
    }
  }

  const ageMap = new Map<string, { label: string; count: number }>();
  for (const group of AGE_GROUPS) {
    ageMap.set(group.key, { label: group.label, count: 0 });
  }
  for (const p of patients) {
    const group = AGE_GROUPS.find((g) => p.age >= g.min && p.age <= g.max);
    if (group) {
      ageMap.get(group.key)!.count += 1;
    }
  }

  const statusLabels: Record<string, string> = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    completada: 'Completada',
    cancelada: 'Cancelada',
  };
  const statusMap = new Map<string, { label: string; count: number }>();
  for (const a of apptsInPeriod) {
    increment(statusMap, a.status, statusLabels[a.status] ?? a.status);
  }

  const franklInPeriod = franklReadings.filter((r) => inRange(r.recordedOn, period.from, period.to));
  const franklMap = new Map<string, { label: string; count: number }>();
  for (const level of ['I', 'II', 'III', 'IV'] as const) {
    franklMap.set(level, { label: `Frankl ${level}`, count: 0 });
  }
  for (const r of franklInPeriod) {
    franklMap.get(r.frankl)!.count += 1;
  }
  const franklTotal = franklInPeriod.length;
  const cooperative = franklInPeriod.filter((r) => r.frankl === 'III' || r.frankl === 'IV').length;
  const franklCooperativePct = franklTotal > 0 ? Math.round((cooperative / franklTotal) * 100) : null;

  const byPatientFrankl = new Map<string, { frankl: 'I' | 'II' | 'III' | 'IV'; recordedOn: string }[]>();
  for (const r of franklReadings) {
    const list = byPatientFrankl.get(r.patientId) ?? [];
    list.push({ frankl: r.frankl, recordedOn: r.recordedOn });
    byPatientFrankl.set(r.patientId, list);
  }
  let franklImproving = 0;
  let franklChallenging = 0;
  for (const readings of byPatientFrankl.values()) {
    const summary = buildFranklSummary(readings);
    if (summary.trend === 'improving') franklImproving += 1;
    if (summary.latestFrankl === 'I' || summary.latestFrankl === 'II') franklChallenging += 1;
  }

  const monthCounts = new Map<string, number>();
  for (const c of consultations) {
    const key = monthKey(c.date);
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }
  const consultationsByMonth = last12MonthKeys(period.to).map((key) => ({
    month: key,
    label: monthLabel(key),
    count: monthCounts.get(key) ?? 0,
  }));

  const rankings = {
    medications: topN(medMap, 8, medTotal),
    appointmentReasons: topN(reasonMap, 8),
    dentalProcedures: topN(dentalMap, 8),
  };

  const kpis = {
    consultations: consultationsInPeriod.length,
    consultationsDelta,
    attendanceRate,
    attendanceRateDelta,
    recallGapPatients,
    recallGapPct,
    franklCooperativePct,
    franklImproving,
    franklChallenging,
    totalPatients,
  };

  const result: ClinicalAnalyticsResult = {
    period: { key: periodKey, ...period },
    kpis,
    series: { consultationsByMonth },
    rankings,
    distributions: {
      ageGroups: [...ageMap.values()].map((e) => ({
        label: e.label,
        count: e.count,
        pct: totalPatients > 0 ? Math.round((e.count / totalPatients) * 100) : 0,
      })),
      appointmentStatus: topN(statusMap, 10),
      frankl: topN(franklMap, 4, franklTotal),
    },
    insights: [],
  };

  result.insights = buildInsights({ kpis, rankings, period: result.period });

  return result;
}
