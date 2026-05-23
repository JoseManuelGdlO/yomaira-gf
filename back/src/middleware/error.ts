import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/errors';
import { env } from '../config/env';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Validation failed', details: err.flatten() },
    });
    return;
  }

  if (err && typeof err === 'object' && 'name' in err && (err as any).name === 'SequelizeUniqueConstraintError') {
    res.status(409).json({
      error: { code: 'CONFLICT', message: 'Resource already exists' },
    });
    return;
  }

  console.error('[error]', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: env.NODE_ENV === 'production' ? 'Internal server error' : message,
    },
  });
}
