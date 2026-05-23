import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import rolesRoutes from './roles.routes';
import permissionsRoutes from './permissions.routes';
import patientsRoutes from './patients.routes';
import appointmentsRoutes from './appointments.routes';
import consultationsRoutes from './consultations.routes';
import prescriptionsRoutes from './prescriptions.routes';
import medicationsRoutes from './medications.routes';
import brandingsRoutes from './brandings.routes';
import clinicalQuestionsRoutes from './clinicalQuestions.routes';
import dashboardRoutes from './dashboard.routes';
import notificationsRoutes from './notifications.routes';
import integrationsRoutes from './integrations.routes';
import publicRoutes from './public.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok', service: 'medflow-api', time: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/patients', patientsRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/consultations', consultationsRoutes);
router.use('/prescriptions', prescriptionsRoutes);
router.use('/medications', medicationsRoutes);
router.use('/brandings', brandingsRoutes);
router.use('/clinical-questions', clinicalQuestionsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/integrations', integrationsRoutes);
router.use('/public', publicRoutes);

export default router;
