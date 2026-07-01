import 'express';

declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      email: string;
      name: string;
      brandingId: string;
      brandingSlug: string;
      roles: string[];
      permissions: string[];
    }

    interface Request {
      user?: AuthUser;
      /** Effective tenant for data scoping (platform_admin may override via X-Acting-Tenant-Id). */
      actingBrandingId?: string;
    }
  }
}

export {};
