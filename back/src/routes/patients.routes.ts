import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as ctrl from '../controllers/patients.controller';
import * as answers from '../controllers/clinicalAnswers.controller';
import * as dentalChart from '../controllers/dentalChart.controller';
import * as treatmentBudget from '../controllers/treatmentBudget.controller';
import * as frankl from '../controllers/frankl.controller';
import * as clinicalSafety from '../controllers/clinicalSafety.controller';

const router = Router();
router.use(authenticate);

const idParam = z.object({ id: z.string().uuid() });

router.get(
  '/',
  requirePermission('patients.read'),
  validate({ query: ctrl.querySchema }),
  asyncHandler(ctrl.list),
);
router.get('/:id', requirePermission('patients.read'), validate({ params: idParam }), asyncHandler(ctrl.get));
router.post(
  '/',
  requirePermission('patients.write'),
  validate({ body: ctrl.createSchema }),
  asyncHandler(ctrl.create),
);
router.patch(
  '/:id',
  requirePermission('patients.write'),
  validate({ params: idParam, body: ctrl.updateSchema }),
  asyncHandler(ctrl.update),
);
router.delete(
  '/:id',
  requirePermission('patients.delete'),
  validate({ params: idParam }),
  asyncHandler(ctrl.remove),
);
router.patch(
  '/:id/consent-photo',
  requirePermission('patients.write'),
  validate({ params: idParam, body: ctrl.consentPhotoSchema }),
  asyncHandler(ctrl.setConsentPhoto),
);

router.get(
  '/:id/clinical-answers',
  requirePermission('patients.read'),
  validate({ params: idParam }),
  asyncHandler(answers.getForPatient),
);
router.put(
  '/:id/clinical-answers',
  requirePermission('patients.write'),
  validate({ params: idParam, body: answers.upsertSchema }),
  asyncHandler(answers.upsertForPatient),
);

router.get(
  '/:id/dental-chart',
  requirePermission('patients.read'),
  validate({ params: idParam }),
  asyncHandler(dentalChart.getForPatient),
);
router.put(
  '/:id/dental-chart',
  requirePermission('patients.write'),
  validate({ params: idParam, body: dentalChart.upsertSchema }),
  asyncHandler(dentalChart.upsertForPatient),
);

router.get(
  '/:id/budget',
  requirePermission('patients.read'),
  validate({ params: idParam }),
  asyncHandler(treatmentBudget.getForPatient),
);
router.put(
  '/:id/budget',
  requirePermission('patients.write'),
  validate({ params: idParam, body: treatmentBudget.upsertSchema }),
  asyncHandler(treatmentBudget.upsertForPatient),
);
router.patch(
  '/:id/budget/attachment',
  requirePermission('patients.write'),
  validate({ params: idParam, body: treatmentBudget.attachmentSchema }),
  asyncHandler(treatmentBudget.setAttachmentForPatient),
);

router.get(
  '/:id/frankl-readings',
  requirePermission('patients.read'),
  validate({ params: idParam }),
  asyncHandler(frankl.listForPatient),
);
router.get(
  '/:id/frankl-summary',
  requirePermission('patients.read'),
  validate({ params: idParam }),
  asyncHandler(frankl.summaryForPatient),
);

router.get(
  '/:id/clinical-safety',
  requirePermission('patients.read'),
  validate({ params: idParam }),
  asyncHandler(clinicalSafety.getForPatient),
);
router.post(
  '/:id/clinical-safety/check',
  requirePermission('patients.read'),
  validate({ params: idParam, body: clinicalSafety.checkBodySchema }),
  asyncHandler(clinicalSafety.checkForPatient),
);

export default router;
