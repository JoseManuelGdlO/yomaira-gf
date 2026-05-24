import { Router } from 'express';
import { Op } from 'sequelize';
import { authenticate } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/authorize';
import { tenantWhere } from '../middleware/tenant';
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
    res.json({ data: items });
  }),
);

export default router;
