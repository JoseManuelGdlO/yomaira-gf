import { NextFunction, Request, Response } from 'express';
import { isPlatformAdminActingAsTenant } from './tenant';
import { Forbidden, Unauthorized } from '../utils/errors';

export function requirePermission(...required: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(Unauthorized());
    if (req.user.roles.includes('admin')) return next();
    if (isPlatformAdminActingAsTenant(req)) return next();
    const has = required.every((code) => req.user!.permissions.includes(code));
    if (!has) return next(Forbidden(`Missing permission(s): ${required.join(', ')}`));
    next();
  };
}

export function requireAnyPermission(...required: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(Unauthorized());
    if (req.user.roles.includes('admin')) return next();
    if (isPlatformAdminActingAsTenant(req)) return next();
    const has = required.some((code) => req.user!.permissions.includes(code));
    if (!has) return next(Forbidden(`Missing permission(s): ${required.join(' | ')}`));
    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(Unauthorized());
    const has = roles.some((r) => req.user!.roles.includes(r));
    if (!has) return next(Forbidden(`Missing role(s): ${roles.join(', ')}`));
    next();
  };
}
