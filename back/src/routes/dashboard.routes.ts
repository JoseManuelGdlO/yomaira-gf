import { Router } from 'express';
import { Op } from 'sequelize';
import { authenticate } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';
import { Appointment, Consultation, Patient, Prescription } from '../models';

const router = Router();
router.use(authenticate);

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

router.get(
  '/stats',
  requireAnyPermission('patients.read', 'appointments.read', 'prescriptions.read', 'consultations.read'),
  asyncHandler(async (_req, res) => {
    const today = todayISO();
    const [patientsCount, appointmentsTotal, todayAppointments, confirmedAppointments, prescriptionsCount, consultationsCount] =
      await Promise.all([
        Patient.count(),
        Appointment.count(),
        Appointment.count({ where: { date: today } }),
        Appointment.count({ where: { status: 'confirmada' } }),
        Prescription.count(),
        Consultation.count(),
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
  asyncHandler(async (_req, res) => {
    const today = todayISO();
    const items = await Appointment.findAll({
      where: {
        date: { [Op.gte]: today },
        status: { [Op.ne]: 'cancelada' },
      },
      order: [
        ['date', 'ASC'],
        ['time', 'ASC'],
      ],
      limit: 10,
    });
    res.json({ data: items });
  }),
);

export default router;
