import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as ctrl from '../controllers/notifications.controller';

const router = Router();
router.use(authenticate);

router.get('/preferences', asyncHandler(ctrl.getPreferences));
router.patch(
  '/preferences',
  validate({ body: ctrl.updatePreferencesSchema }),
  asyncHandler(ctrl.updatePreferences),
);
router.post(
  '/push/subscribe',
  validate({ body: ctrl.subscribeSchema }),
  asyncHandler(ctrl.subscribePush),
);
router.delete(
  '/push/subscribe',
  validate({ body: ctrl.unsubscribeSchema }),
  asyncHandler(ctrl.unsubscribePush),
);

export default router;
