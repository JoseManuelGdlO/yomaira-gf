import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as ctrl from '../controllers/clinicalQuestions.controller';

const router = Router();
router.use(authenticate);

const idParam = z.object({ id: z.string().uuid() });

router.get('/', requirePermission('clinical_questions.read'), asyncHandler(ctrl.list));
router.post(
  '/',
  requirePermission('clinical_questions.write'),
  validate({ body: ctrl.createSchema }),
  asyncHandler(ctrl.create),
);
router.patch(
  '/:id',
  requirePermission('clinical_questions.write'),
  validate({ params: idParam, body: ctrl.updateSchema }),
  asyncHandler(ctrl.update),
);
router.delete(
  '/:id',
  requirePermission('clinical_questions.write'),
  validate({ params: idParam }),
  asyncHandler(ctrl.remove),
);

export default router;
