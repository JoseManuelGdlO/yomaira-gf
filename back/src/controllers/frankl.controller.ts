import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Appointment, Patient, PatientDentalChart, PatientFranklReading } from '../models';
import type { FranklScale } from '../models/PatientDentalChart';
import { findTenantPatient } from '../middleware/tenant';
import { buildFranklSummary, type FranklSummary } from '../services/frankl/franklInsights';

function readingsToInput(rows: PatientFranklReading[]) {
  return rows.map((r) => ({ frankl: r.frankl, recordedOn: r.recordedOn }));
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function listForPatient(req: Request, res: Response): Promise<void> {
  await findTenantPatient(req, req.params.id);
  const readings = await PatientFranklReading.findAll({
    where: { patientId: req.params.id },
    order: [
      ['recordedOn', 'ASC'],
      ['createdAt', 'ASC'],
    ],
  });
  res.json({ data: readings });
}

export async function summaryForPatient(req: Request, res: Response): Promise<void> {
  await findTenantPatient(req, req.params.id);
  const [readings, chart] = await Promise.all([
    PatientFranklReading.findAll({
      where: { patientId: req.params.id },
      order: [
        ['recordedOn', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    }),
    PatientDentalChart.findOne({ where: { patientId: req.params.id } }),
  ]);
  res.json({
    data: withChartFrankl(buildFranklSummary(readingsToInput(readings)), chart?.frankl),
  });
}

function withChartFrankl(
  summary: ReturnType<typeof buildFranklSummary>,
  chartFrankl: FranklScale | undefined,
): FranklSummary {
  return { ...summary, chartFrankl: chartFrankl ?? 'na' };
}

function isChallengingFrankl(frankl: string | null | undefined): boolean {
  return frankl === 'I' || frankl === 'II' || frankl === 'III';
}

function rowNeedsAttention(row: {
  latestFrankl: string | null;
  chartFrankl: FranklScale;
  alerts: FranklSummary['alerts'];
}): boolean {
  return (
    row.alerts.some((a) => a.type === 'sedation' || a.type === 'extra_time') ||
    isChallengingFrankl(row.latestFrankl) ||
    isChallengingFrankl(row.chartFrankl)
  );
}

export async function dashboardFrankl(req: Request, res: Response): Promise<void> {
  const brandingId = req.user!.brandingId;
  const scope = (req.query.scope as string | undefined) ?? 'all';
  const today = todayISO();

  const patients = await Patient.findAll({
    where: { brandingId },
    attributes: ['id', 'name', 'age', 'lastVisit'],
    order: [['name', 'ASC']],
  });

  const patientIds = patients.map((p) => p.id);
  if (patientIds.length === 0) {
    res.json({
      data: {
        counts: { sedationAlert: 0, challengingLatest: 0, improving: 0, totalWithReadings: 0 },
        patients: [],
        todayAppointments: [],
      },
    });
    return;
  }

  const allReadings = await PatientFranklReading.findAll({
    where: { patientId: { [Op.in]: patientIds } },
    order: [
      ['recordedOn', 'ASC'],
      ['createdAt', 'ASC'],
    ],
  });

  const byPatient = new Map<string, PatientFranklReading[]>();
  for (const r of allReadings) {
    const list = byPatient.get(r.patientId) ?? [];
    list.push(r);
    byPatient.set(r.patientId, list);
  }

  const charts = await PatientDentalChart.findAll({
    where: { patientId: { [Op.in]: patientIds } },
    attributes: ['patientId', 'frankl'],
  });
  const chartFranklByPatient = new Map(charts.map((c) => [c.patientId, c.frankl]));

  type PatientRow = {
    patientId: string;
    patientName: string;
    age: number;
    lastVisit: string;
    latestFrankl: string | null;
    latestRecordedOn: string | null;
    readingCount: number;
    trend: string;
    alerts: ReturnType<typeof buildFranklSummary>['alerts'];
    primaryAlert: ReturnType<typeof buildFranklSummary>['primaryAlert'];
    chartFrankl: FranklScale;
  };

  const rows: PatientRow[] = [];

  for (const p of patients) {
    const readings = byPatient.get(p.id) ?? [];
    const chartFrankl = chartFranklByPatient.get(p.id) ?? 'na';
    if (readings.length === 0 && chartFrankl === 'na') continue;

    const summary = buildFranklSummary(readingsToInput(readings));
    rows.push({
      patientId: p.id,
      patientName: p.name,
      age: p.age,
      lastVisit: p.lastVisit,
      latestFrankl: summary.latestFrankl,
      latestRecordedOn: summary.latestRecordedOn,
      readingCount: summary.readingCount,
      trend: summary.trend,
      alerts: summary.alerts,
      primaryAlert: summary.primaryAlert,
      chartFrankl,
    });
  }

  const sedationAlert = rows.filter((r) => r.alerts.some((a) => a.type === 'sedation')).length;
  const challengingLatest = rows.filter((r) => rowNeedsAttention(r)).length;
  const improving = rows.filter((r) => r.trend === 'improving').length;

  const filtered = rows.filter((r) => rowNeedsAttention(r));

  let todayAppointments: Array<Record<string, unknown>> = [];
  if (scope === 'today') {
    const appts = await Appointment.findAll({
      where: {
        brandingId,
        date: today,
        status: { [Op.ne]: 'cancelada' },
      },
      order: [['time', 'ASC']],
    });

    const patientMap = new Map(patients.map((p) => [p.id, p]));
    todayAppointments = appts
      .map((a) => {
        const row = rows.find((r) => r.patientId === a.patientId);
        if (!row) return null;
        const hasRelevant = rowNeedsAttention(row);
        if (!hasRelevant) return null;
        const p = patientMap.get(a.patientId);
        return {
          appointmentId: a.id,
          patientId: a.patientId,
          patientName: p?.name ?? '',
          time: a.time,
          reason: a.reason,
          status: a.status,
          franklSummary: withChartFrankl(
            buildFranklSummary(readingsToInput(byPatient.get(a.patientId) ?? [])),
            chartFranklByPatient.get(a.patientId),
          ),
        };
      })
      .filter(Boolean) as Array<Record<string, unknown>>;
  }

  res.json({
    data: {
      counts: {
        sedationAlert,
        challengingLatest,
        improving,
        totalWithReadings: rows.length,
      },
      patients: filtered.sort((a, b) => (a.patientName > b.patientName ? 1 : -1)),
      todayAppointments,
    },
  });
}

export async function franklSummariesForPatients(
  brandingId: string,
  patientIds: string[],
): Promise<Map<string, FranklSummary>> {
  if (patientIds.length === 0) return new Map();

  const readings = await PatientFranklReading.findAll({
    where: { brandingId, patientId: { [Op.in]: patientIds } },
    order: [
      ['recordedOn', 'ASC'],
      ['createdAt', 'ASC'],
    ],
  });

  const byPatient = new Map<string, PatientFranklReading[]>();
  for (const r of readings) {
    const list = byPatient.get(r.patientId) ?? [];
    list.push(r);
    byPatient.set(r.patientId, list);
  }

  const charts = await PatientDentalChart.findAll({
    where: { patientId: { [Op.in]: patientIds } },
    attributes: ['patientId', 'frankl'],
  });
  const chartFranklByPatient = new Map(charts.map((c) => [c.patientId, c.frankl]));

  const result = new Map<string, FranklSummary>();
  for (const id of patientIds) {
    const list = byPatient.get(id) ?? [];
    const chartFrankl = chartFranklByPatient.get(id) ?? 'na';
    if (list.length > 0 || chartFrankl !== 'na') {
      result.set(id, withChartFrankl(buildFranklSummary(readingsToInput(list)), chartFrankl));
    }
  }
  return result;
}
