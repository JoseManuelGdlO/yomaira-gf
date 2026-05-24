import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models';
import { loadUserWithPermissions } from '../middleware/auth';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt';
import { verifyPassword } from '../utils/password';
import { Unauthorized } from '../utils/errors';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function tokenPayload(user: Express.AuthUser) {
  return { sub: user.id, email: user.email, brandingId: user.brandingId };
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user || !user.active) throw Unauthorized('Invalid credentials');
  const ok = await verifyPassword(password, user.password);
  if (!ok) throw Unauthorized('Invalid credentials');

  const authUser = await loadUserWithPermissions(user.id);
  if (!authUser) throw Unauthorized('Cannot load user');

  const accessToken = signAccessToken(tokenPayload(authUser));
  const refreshToken = signRefreshToken({ sub: user.id, email: user.email, brandingId: user.brandingId });

  res.json({
    data: {
      user: authUser,
      accessToken,
      refreshToken,
    },
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json({ data: req.user });
}

export const refreshSchema = z.object({ refreshToken: z.string().min(1) });

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
  let payload;
  try {
    payload = verifyToken(refreshToken);
  } catch {
    throw Unauthorized('Invalid or expired refresh token');
  }
  if (payload.type !== 'refresh') throw Unauthorized('Wrong token type');

  const user = await User.findByPk(payload.sub);
  if (!user || !user.active) throw Unauthorized('User not found or inactive');
  if (user.brandingId !== payload.brandingId) throw Unauthorized('Tenant context mismatch');

  const authUser = await loadUserWithPermissions(user.id);
  if (!authUser) throw Unauthorized('Cannot load user');

  const newAccess = signAccessToken(tokenPayload(authUser));
  const newRefresh = signRefreshToken({ sub: user.id, email: user.email, brandingId: user.brandingId });
  res.json({ data: { accessToken: newAccess, refreshToken: newRefresh, user: authUser } });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.json({ data: { ok: true } });
}
