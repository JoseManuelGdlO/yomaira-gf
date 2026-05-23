import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';
import { Permission } from '../models';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  requirePermission('roles.read'),
  asyncHandler(async (_req, res) => {
    const items = await Permission.findAll({ order: [['code', 'ASC']] });
    res.json({ data: items });
  }),
);

export default router;
