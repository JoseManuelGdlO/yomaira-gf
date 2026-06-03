import { Router } from 'express';
import { Op } from 'sequelize';
import { authenticate } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/authorize';
import { tenantWhere } from '../middleware/tenant';
import { asyncHandler } from '../utils/asyncHandler';
import { Appointment, Consultation, Patient, Prescription } from '../models';
import * as franklCtrl from '../controllers/frankl.controller';
import * as analyticsCtrl from '../controllers/analytics.controller';

const router = Router();
router.use(authenticate);

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

router.get(
  '/stats',
  requireAnyPermission('patients.read', 'appointments.read', 'prescriptions.read', 'consultations.read'),
  asyncHandler(async (req, res) => {
    const today = todayISO();
    const tenant = tenantWhere(req);
    const [patientsCount, appointmentsTotal, todayAppointments, confirmedAppointments, prescriptionsCount, consultationsCount] =
      await Promise.all([
        Patient.count({ where: tenant }),
        Appointment.count({ where: tenant }),
        Appointment.count({ where: { ...tenant, date: today } }),
        Appointment.count({ where: { ...tenant, status: 'confirmada' } }),
        Prescription.count({
          include: [{ model: Patient, as: 'patient', where: tenant, required: true }],
        }),
        Consultation.count({
          include: [{ model: Patient, as: 'patient', where: tenant, required: true }],
        }),
      ]);
    res.json({
      data: {
        patients: patientsCount,
        appointmentsTotal,
        todayAppointments,
        confirmedAppointments,
        prescriptions: prescriptionsCount,
        consultations: consultationsCount,
      },
    });
  }),
);

router.get(
  '/upcoming',
  requireAnyPermission('appointments.read'),
  asyncHandler(async (req, res) => {
    const today = todayISO();
    const items = await Appointment.findAll({
      where: {
        ...tenantWhere(req),
        date: { [Op.gte]: today },
        status: { [Op.ne]: 'cancelada' },
      },
      order: [
        ['date', 'ASC'],
        ['time', 'ASC'],
      ],
      limit: 10,
    });

    const patientIds = [...new Set(items.map((a) => a.patientId))];
    const summaries = await franklCtrl.franklSummariesForPatients(req.user!.brandingId, patientIds);

    const enriched = items.map((a) => {
      const plain = { ...a.toJSON() } as Record<string, unknown>;
      const summary = summaries.get(a.patientId);
      if (summary) {
        plain.franklSummary = summary;
      }
      return plain;
    });

    res.json({ data: enriched });
  }),
);

router.get(
  '/frankl',
  requireAnyPermission('patients.read'),
  asyncHandler(franklCtrl.dashboardFrankl),
);

router.get(
  '/analytics',
  requireAnyPermission('patients.read', 'appointments.read', 'consultations.read', 'prescriptions.read'),
  asyncHandler(analyticsCtrl.dashboardAnalytics),
);

export default router;
