import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as ctrl from '../controllers/consultations.controller';

const router = Router();
router.use(authenticate);

const idParam = z.object({ id: z.string().uuid() });

router.get(
  '/',
  requirePermission('consultations.read'),
  validate({ query: ctrl.querySchema }),
  asyncHandler(ctrl.list),
);
router.get('/:id', requirePermission('consultations.read'), validate({ params: idParam }), asyncHandler(ctrl.get));
router.post(
  '/',
  requirePermission('consultations.write'),
  validate({ body: ctrl.createSchema }),
  asyncHandler(ctrl.create),
);
router.patch(
  '/:id',
  requirePermission('consultations.write'),
  validate({ params: idParam, body: ctrl.updateSchema }),
  asyncHandler(ctrl.update),
);
router.delete(
  '/:id',
  requirePermission('consultations.delete'),
  validate({ params: idParam }),
  asyncHandler(ctrl.remove),
);

export default router;
