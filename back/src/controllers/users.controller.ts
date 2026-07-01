import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import { Permission, Role, User, UserRole } from '../models';
import { tenantWhere } from '../middleware/tenant';
import { hashPassword } from '../utils/password';
import { Conflict, Forbidden, NotFound } from '../utils/errors';

const includeRoles = {
  include: [{ model: Role, through: { attributes: [] }, include: [{ model: Permission, through: { attributes: [] } }] }],
};

export function serializeUser(user: User): Record<string, unknown> {
  const roles = (user.Roles ?? []) as Array<Role & { Permissions?: Permission[] }>;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    active: user.active,
    roles: roles.map((r) => ({ id: r.id, name: r.name, description: r.description })),
    permissions: Array.from(new Set(roles.flatMap((r) => (r.Permissions ?? []).map((p) => p.code)))),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function findTenantUser(req: Request, id: string): Promise<User> {
  const user = await User.findOne({ where: { id, ...tenantWhere(req) }, ...includeRoles });
  if (!user) throw NotFound('User not found');
  return user;
}

async function assertTenantRoles(req: Request, roleIds: string[]): Promise<Role[]> {
  if (!roleIds.length) return [];
  const roles = await Role.findAll({ where: { id: { [Op.in]: roleIds }, ...tenantWhere(req) } });
  if (roles.length !== roleIds.length) throw Forbidden('Invalid role');
  return roles;
}

export async function list(req: Request, res: Response): Promise<void> {
  const users = await User.findAll({ where: tenantWhere(req), ...includeRoles, order: [['name', 'ASC']] });
  res.json({ data: users.map(serializeUser) });
}

export async function get(req: Request, res: Response): Promise<void> {
  const user = await findTenantUser(req, req.params.id);
  res.json({ data: serializeUser(user) });
}

export const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  active: z.boolean().optional(),
  roleIds: z.array(z.string().uuid()).optional(),
});

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof createSchema>;
  const exists = await User.findOne({ where: { email: body.email.toLowerCase() } });
  if (exists) throw Conflict('Email already in use');

  const user = await User.create({
    brandingId: req.user!.brandingId,
    email: body.email.toLowerCase(),
    password: await hashPassword(body.password),
    name: body.name,
    active: body.active ?? true,
  });

  if (body.roleIds?.length) {
    const roles = await assertTenantRoles(req, body.roleIds);
    await UserRole.bulkCreate(roles.map((r) => ({ userId: user.id, roleId: r.id })));
  }

  const fresh = await User.findByPk(user.id, includeRoles);
  res.status(201).json({ data: serializeUser(fresh!) });
}

export const updateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

export async function update(req: Request, res: Response): Promise<void> {
  const user = await findTenantUser(req, req.params.id);
  const body = req.body as z.infer<typeof updateSchema>;
  if (body.email && body.email.toLowerCase() !== user.email) {
    const exists = await User.findOne({ where: { email: body.email.toLowerCase() } });
    if (exists) throw Conflict('Email already in use');
    user.email = body.email.toLowerCase();
  }
  if (body.password) user.password = await hashPassword(body.password);
  if (body.name) user.name = body.name;
  if (typeof body.active === 'boolean') user.active = body.active;
  await user.save();
  const fresh = await User.findByPk(user.id, includeRoles);
  res.json({ data: serializeUser(fresh!) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const user = await findTenantUser(req, req.params.id);
  await UserRole.destroy({ where: { userId: user.id } });
  await user.destroy();
  res.status(204).end();
}

export const setRolesSchema = z.object({ roleIds: z.array(z.string().uuid()) });

export async function setRoles(req: Request, res: Response): Promise<void> {
  const user = await findTenantUser(req, req.params.id);
  const { roleIds } = req.body as z.infer<typeof setRolesSchema>;
  await assertTenantRoles(req, roleIds);
  await UserRole.destroy({ where: { userId: user.id } });
  if (roleIds.length) {
    await UserRole.bulkCreate(roleIds.map((roleId) => ({ userId: user.id, roleId })));
  }
  const fresh = await User.findByPk(user.id, includeRoles);
  res.json({ data: serializeUser(fresh!) });
}

export async function removeRole(req: Request, res: Response): Promise<void> {
  const { id, roleId } = req.params;
  await findTenantUser(req, id);
  const role = await Role.findOne({ where: { id: roleId, ...tenantWhere(req) } });
  if (!role) throw Forbidden('Invalid role');
  await UserRole.destroy({ where: { userId: id, roleId } });
  const fresh = await User.findByPk(id, includeRoles);
  if (!fresh) throw NotFound('User not found');
  res.json({ data: serializeUser(fresh) });
}
