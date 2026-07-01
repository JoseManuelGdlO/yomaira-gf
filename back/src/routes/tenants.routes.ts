import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as ctrl from '../controllers/tenants.controller';

const router = Router();
router.use(authenticate);
router.use(requireRole('platform_admin'));

const idParam = z.object({ id: z.string().uuid() });

router.get('/', asyncHandler(ctrl.list));
router.get('/:id/users', validate({ params: idParam }), asyncHandler(ctrl.listUsers));
router.get('/:id', validate({ params: idParam }), asyncHandler(ctrl.get));
router.post('/', validate({ body: ctrl.createSchema }), asyncHandler(ctrl.create));
router.patch('/:id', validate({ params: idParam, body: ctrl.updateSchema }), asyncHandler(ctrl.update));
router.patch('/:id/deactivate', validate({ params: idParam }), asyncHandler(ctrl.deactivate));

export default router;
