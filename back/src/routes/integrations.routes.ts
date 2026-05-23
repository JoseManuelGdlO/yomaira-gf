import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as ctrl from '../controllers/integrations.controller';

const router = Router();

router.get('/google/callback', asyncHandler(ctrl.googleCallback));

router.use(authenticate);


router.get('/google/connect', asyncHandler(ctrl.googleConnect));
router.get('/google/status', asyncHandler(ctrl.googleStatus));
router.delete('/google', asyncHandler(ctrl.googleDisconnect));

export default router;
