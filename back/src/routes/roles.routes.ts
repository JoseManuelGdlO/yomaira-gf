import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as ctrl from '../controllers/roles.controller';

const router = Router();
router.use(authenticate);

const idParam = z.object({ id: z.string().uuid() });

router.get('/', requirePermission('roles.read'), asyncHandler(ctrl.list));
router.get('/:id', requirePermission('roles.read'), validate({ params: idParam }), asyncHandler(ctrl.get));
router.post('/', requirePermission('roles.write'), validate({ body: ctrl.createSchema }), asyncHandler(ctrl.create));
router.patch(
  '/:id',
  requirePermission('roles.write'),
  validate({ params: idParam, body: ctrl.updateSchema }),
  asyncHandler(ctrl.update),
);
router.delete(
  '/:id',
  requirePermission('roles.write'),
  validate({ params: idParam }),
  asyncHandler(ctrl.remove),
);
router.put(
  '/:id/permissions',
  requirePermission('roles.write'),
  validate({ params: idParam, body: ctrl.setPermissionsSchema }),
  asyncHandler(ctrl.setPermissions),
);

export default router;
