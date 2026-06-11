import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as ctrl from '../controllers/inventory.controller';

const router = Router();
router.use(authenticate);

const idParam = z.object({ id: z.string().uuid() });

router.get('/', requirePermission('inventory.read'), asyncHandler(ctrl.list));
router.get('/low-stock', requirePermission('inventory.read'), asyncHandler(ctrl.lowStock));
router.get('/:id', requirePermission('inventory.read'), validate({ params: idParam }), asyncHandler(ctrl.get));
router.post(
  '/',
  requirePermission('inventory.write'),
  validate({ body: ctrl.createSchema }),
  asyncHandler(ctrl.create),
);
router.patch(
  '/:id',
  requirePermission('inventory.write'),
  validate({ params: idParam, body: ctrl.updateSchema }),
  asyncHandler(ctrl.update),
);
router.post(
  '/:id/restock',
  requirePermission('inventory.write'),
  validate({ params: idParam, body: ctrl.restockSchema }),
  asyncHandler(ctrl.restock),
);
router.delete(
  '/:id',
  requirePermission('inventory.write'),
  validate({ params: idParam }),
  asyncHandler(ctrl.remove),
);

export default router;
