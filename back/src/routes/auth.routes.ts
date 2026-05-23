import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  login,
  loginSchema,
  logout,
  me,
  refresh,
  refreshSchema,
} from '../controllers/auth.controller';

const router = Router();

router.post('/login', validate({ body: loginSchema }), asyncHandler(login));
router.post('/refresh', validate({ body: refreshSchema }), asyncHandler(refresh));
router.get('/me', authenticate, asyncHandler(me));
router.post('/logout', authenticate, asyncHandler(logout));

export default router;
