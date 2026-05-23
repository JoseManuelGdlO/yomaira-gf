import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import { Permission, Role, User, UserRole } from '../models';
import { hashPassword } from '../utils/password';
import { Conflict, Forbidden, NotFound } from '../utils/errors';

const includeRoles = {
  include: [{ model: Role, through: { attributes: [] }, include: [{ model: Permission, through: { attributes: [] } }] }],
};

function serialize(user: User): Record<string, unknown> {
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

export async function list(_req: Request, res: Response): Promise<void> {
  const users = await User.findAll({ ...includeRoles, order: [['name', 'ASC']] });
  res.json({ data: users.map(serialize) });
}

export async function get(req: Request, res: Response): Promise<void> {
  const user = await User.findByPk(req.params.id, includeRoles);
  if (!user) throw NotFound('User not found');
  res.json({ data: serialize(user) });
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
    email: body.email.toLowerCase(),
    password: await hashPassword(body.password),
    name: body.name,
    active: body.active ?? true,
  });

  if (body.roleIds?.length) {
    const roles = await Role.findAll({ where: { id: { [Op.in]: body.roleIds } } });
    if (roles.length !== body.roleIds.length) throw Forbidden('Invalid role');
    await UserRole.bulkCreate(roles.map((r) => ({ userId: user.id, roleId: r.id })));
  }

  const fresh = await User.findByPk(user.id, includeRoles);
  res.status(201).json({ data: serialize(fresh!) });
}

export const updateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

export async function update(req: Request, res: Response): Promise<void> {
  const user = await User.findByPk(req.params.id);
  if (!user) throw NotFound('User not found');
  const body = req.body as z.infer<typeof updateSchema>;
  if (body.email) user.email = body.email.toLowerCase();
  if (body.password) user.password = await hashPassword(body.password);
  if (body.name) user.name = body.name;
  if (typeof body.active === 'boolean') user.active = body.active;
  await user.save();
  const fresh = await User.findByPk(user.id, includeRoles);
  res.json({ data: serialize(fresh!) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const user = await User.findByPk(req.params.id);
  if (!user) throw NotFound('User not found');
  await UserRole.destroy({ where: { userId: user.id } });
  await user.destroy();
  res.status(204).end();
}

export const setRolesSchema = z.object({ roleIds: z.array(z.string().uuid()) });

export async function setRoles(req: Request, res: Response): Promise<void> {
  const user = await User.findByPk(req.params.id);
  if (!user) throw NotFound('User not found');
  const { roleIds } = req.body as z.infer<typeof setRolesSchema>;
  const roles = await Role.findAll({ where: { id: { [Op.in]: roleIds } } });
  if (roles.length !== roleIds.length) throw Forbidden('Invalid role');
  await UserRole.destroy({ where: { userId: user.id } });
  if (roleIds.length) {
    await UserRole.bulkCreate(roleIds.map((roleId) => ({ userId: user.id, roleId })));
  }
  const fresh = await User.findByPk(user.id, includeRoles);
  res.json({ data: serialize(fresh!) });
}

export async function removeRole(req: Request, res: Response): Promise<void> {
  const { id, roleId } = req.params;
  await UserRole.destroy({ where: { userId: id, roleId } });
  const fresh = await User.findByPk(id, includeRoles);
  if (!fresh) throw NotFound('User not found');
  res.json({ data: serialize(fresh) });
}
