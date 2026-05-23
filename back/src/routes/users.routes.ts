import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as ctrl from '../controllers/users.controller';

const router = Router();
router.use(authenticate);


const idParam = z.object({ id: z.string().uuid() });
const userRoleParam = z.object({ id: z.string().uuid(), roleId: z.string().uuid() });

router.get('/', requirePermission('users.read'), asyncHandler(ctrl.list));
router.get('/:id', requirePermission('users.read'), validate({ params: idParam }), asyncHandler(ctrl.get));
router.post(
  '/',
  requirePermission('users.write'),
  validate({ body: ctrl.createSchema }),
  asyncHandler(ctrl.create),
);
router.patch(
  '/:id',
  requirePermission('users.write'),
  validate({ params: idParam, body: ctrl.updateSchema }),
  asyncHandler(ctrl.update),
);
router.delete(
  '/:id',
  requirePermission('users.delete'),
  validate({ params: idParam }),
  asyncHandler(ctrl.remove),
);
router.put(
  '/:id/roles',
  requirePermission('users.write'),
  validate({ params: idParam, body: ctrl.setRolesSchema }),
  asyncHandler(ctrl.setRoles),
);
router.delete(
  '/:id/roles/:roleId',
  requirePermission('users.write'),
  validate({ params: userRoleParam }),
  asyncHandler(ctrl.removeRole),
);

export default router;
