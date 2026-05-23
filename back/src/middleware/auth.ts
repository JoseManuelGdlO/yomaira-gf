import { NextFunction, Request, Response } from 'express';
import { Permission, Role, User, UserRole } from '../models';
import { Unauthorized } from '../utils/errors';
import { verifyToken } from '../utils/jwt';

async function loadRolesForUser(userId: string): Promise<{ roles: string[]; permissions: string[] }> {
  const userRoles = await UserRole.findAll({
    where: { userId },
    include: [
      {
        model: Role,
        as: 'role',
        required: true,
        include: [{ model: Permission, through: { attributes: [] } }],
      },
    ],
  });

  const permSet = new Set<string>();
  const roleNames: string[] = [];

  for (const ur of userRoles) {
    const role = ur.get('role') as Role & { Permissions?: Permission[] };
    if (!role) continue;
    roleNames.push(role.name);
    for (const p of role.Permissions ?? []) permSet.add(p.code);
  }

  return { roles: roleNames, permissions: Array.from(permSet) };
}

export async function loadUserWithPermissions(userId: string): Promise<Express.AuthUser | null> {
  const user = await User.findByPk(userId);
  if (!user || !user.active) return null;
  const { roles, permissions } = await loadRolesForUser(userId);
  return { id: user.id, email: user.email, name: user.name, roles, permissions };
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw Unauthorized('Missing or invalid Authorization header');
    }
    const token = header.slice('Bearer '.length).trim();
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw Unauthorized('Invalid or expired token');
    }
    if (payload.type && payload.type !== 'access') {
      throw Unauthorized('Wrong token type');
    }

    const authUser = await loadUserWithPermissions(payload.sub);
    if (!authUser) throw Unauthorized('User not found or inactive');
    req.user = authUser;
    next();
  } catch (err) {
    next(err);
  }
}
