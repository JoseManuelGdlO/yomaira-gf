import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as ctrl from '../controllers/brandings.controller';

const router = Router();
router.use(authenticate);

const idParam = z.object({ id: z.string().uuid() });

router.get('/me', requirePermission('branding.read'), asyncHandler(ctrl.me));
router.get('/:id', requirePermission('branding.read'), validate({ params: idParam }), asyncHandler(ctrl.get));
router.patch(
  '/:id',
  requirePermission('branding.write'),
  validate({ params: idParam, body: ctrl.updateSchema }),
  asyncHandler(ctrl.update),
);

export default router;
