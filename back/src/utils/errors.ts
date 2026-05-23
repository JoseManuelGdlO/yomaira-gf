export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, code = 'ERROR', details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const BadRequest = (message = 'Bad request', details?: unknown) =>
  new HttpError(400, message, 'BAD_REQUEST', details);
export const Unauthorized = (message = 'Unauthorized') => new HttpError(401, message, 'UNAUTHORIZED');
export const Forbidden = (message = 'Forbidden') => new HttpError(403, message, 'FORBIDDEN');
export const NotFound = (message = 'Resource not found') => new HttpError(404, message, 'NOT_FOUND');
export const Conflict = (message = 'Conflict') => new HttpError(409, message, 'CONFLICT');
export const Internal = (message = 'Internal server error') => new HttpError(500, message, 'INTERNAL');
