import 'express';

declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      email: string;
      name: string;
      roles: string[];
      permissions: string[];
    }

    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
