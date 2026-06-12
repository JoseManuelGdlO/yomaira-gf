import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as ctrl from '../controllers/finances.controller';

const router = Router();
router.use(authenticate);

const idParam = z.object({ id: z.string().uuid() });

router.get('/summary', requirePermission('finances.read'), asyncHandler(ctrl.summary));
router.get('/charges', requirePermission('finances.read'), asyncHandler(ctrl.listCharges));
router.get(
  '/charges/:id',
  requirePermission('finances.read'),
  validate({ params: idParam }),
  asyncHandler(ctrl.getCharge),
);
router.post(
  '/charges',
  requirePermission('finances.write'),
  validate({ body: ctrl.createChargeSchema }),
  asyncHandler(ctrl.createCharge),
);
router.patch(
  '/charges/:id',
  requirePermission('finances.write'),
  validate({ params: idParam, body: ctrl.updateChargeSchema }),
  asyncHandler(ctrl.updateCharge),
);
router.delete(
  '/charges/:id',
  requirePermission('finances.write'),
  validate({ params: idParam }),
  asyncHandler(ctrl.removeCharge),
);

router.get('/expenses', requirePermission('finances.read'), asyncHandler(ctrl.listExpenses));
router.get(
  '/expenses/:id',
  requirePermission('finances.read'),
  validate({ params: idParam }),
  asyncHandler(ctrl.getExpense),
);
router.post(
  '/expenses',
  requirePermission('finances.write'),
  validate({ body: ctrl.createExpenseSchema }),
  asyncHandler(ctrl.createExpense),
);
router.patch(
  '/expenses/:id',
  requirePermission('finances.write'),
  validate({ params: idParam, body: ctrl.updateExpenseSchema }),
  asyncHandler(ctrl.updateExpense),
);
router.delete(
  '/expenses/:id',
  requirePermission('finances.write'),
  validate({ params: idParam }),
  asyncHandler(ctrl.removeExpense),
);

export default router;
