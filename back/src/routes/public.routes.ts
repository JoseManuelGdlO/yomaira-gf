import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as ctrl from '../controllers/publicAppointments.controller';

const router = Router();

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Demasiadas solicitudes. Intenta más tarde.' } },
});

router.use(publicLimiter);

router.get('/branding', asyncHandler(ctrl.getBrandingPublic));
router.get(
  '/patients/lookup',
  validate({ query: ctrl.lookupPatientSchema }),
  asyncHandler(ctrl.lookupPatient),
);
router.get(
  '/appointment-slots',
  validate({ query: ctrl.slotsQuerySchema }),
  asyncHandler(ctrl.availableSlots),
);
router.post(
  '/appointment-requests',
  validate({ body: ctrl.bookSchema }),
  asyncHandler(ctrl.bookAppointment),
);

const cancelParams = z.object({ id: z.string().uuid() });
router.post(
  '/appointments/:id/cancel',
  validate({ params: cancelParams, body: z.object({ token: z.string().min(1) }) }),
  asyncHandler(ctrl.cancelPublic),
);

export default router;
