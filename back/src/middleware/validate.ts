import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { BadRequest } from '../utils/errors';

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as Request['query'];
      if (schemas.params) req.params = schemas.params.parse(req.params) as Request['params'];
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(BadRequest('Validation failed', err.flatten()));
      } else {
        next(err);
      }
    }
  };
}
