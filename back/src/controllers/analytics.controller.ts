import { Request, Response } from 'express';
import {
  buildClinicalAnalytics,
  type AnalyticsPeriod,
} from '../services/analytics/clinicalAnalytics';

const VALID_PERIODS: AnalyticsPeriod[] = ['30d', '90d', '365d', 'all'];

export async function dashboardAnalytics(req: Request, res: Response): Promise<void> {
  const raw = (req.query.period as string | undefined) ?? '90d';
  const period: AnalyticsPeriod = VALID_PERIODS.includes(raw as AnalyticsPeriod)
    ? (raw as AnalyticsPeriod)
    : '90d';

  const data = await buildClinicalAnalytics(req.user!.brandingId, period);
  res.json({ data });
}
