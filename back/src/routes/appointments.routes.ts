import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as ctrl from '../controllers/appointments.controller';

const router = Router();
router.use(authenticate);

const idParam = z.object({ id: z.string().uuid() });

router.get(
  '/',
  requirePermission('appointments.read'),
  validate({ query: ctrl.querySchema }),
  asyncHandler(ctrl.list),
);
router.get('/:id', requirePermission('appointments.read'), validate({ params: idParam }), asyncHandler(ctrl.get));
router.post(
  '/',
  requirePermission('appointments.write'),
  validate({ body: ctrl.createSchema }),
  asyncHandler(ctrl.create),
);
router.patch(
  '/:id',
  requirePermission('appointments.write'),
  validate({ params: idParam, body: ctrl.updateSchema }),
  asyncHandler(ctrl.update),
);
router.delete(
  '/:id',
  requirePermission('appointments.delete'),
  validate({ params: idParam }),
  asyncHandler(ctrl.remove),
);
router.patch(
  '/:id/status',
  requirePermission('appointments.write'),
  validate({ params: idParam, body: ctrl.statusSchema }),
  asyncHandler(ctrl.setStatus),
);
router.post(
  '/:id/complete',
  requirePermission('appointments.write'),
  validate({ params: idParam, body: ctrl.completeSchema }),
  asyncHandler(ctrl.complete),
);

export default router;
