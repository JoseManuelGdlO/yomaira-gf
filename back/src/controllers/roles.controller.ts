import { Request, Response } from 'express';
import { z } from 'zod';
import { Permission, Role, RolePermission } from '../models';
import { Conflict, Forbidden, NotFound } from '../utils/errors';

const includePermissions = {
  include: [{ model: Permission, through: { attributes: [] } }],
};

function serializeRole(role: Role): Record<string, unknown> {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: ((role as any).Permissions ?? []).map((p: Permission) => ({
      id: p.id,
      code: p.code,
      description: p.description,
    })),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

export async function list(_req: Request, res: Response): Promise<void> {
  const roles = await Role.findAll({ ...includePermissions, order: [['name', 'ASC']] });
  res.json({ data: roles.map(serializeRole) });
}

export async function get(req: Request, res: Response): Promise<void> {
  const role = await Role.findByPk(req.params.id, includePermissions);
  if (!role) throw NotFound('Role not found');
  res.json({ data: serializeRole(role) });
}

export const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof createSchema>;
  const exists = await Role.findOne({ where: { name: body.name } });
  if (exists) throw Conflict('Role name already exists');
  const role = await Role.create({
    name: body.name,
    description: body.description ?? null,
  });
  if (body.permissionIds?.length) {
    await RolePermission.bulkCreate(
      body.permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
    );
  }
  const fresh = await Role.findByPk(role.id, includePermissions);
  res.status(201).json({ data: serializeRole(fresh!) });
}

export const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

export async function update(req: Request, res: Response): Promise<void> {
  const role = await Role.findByPk(req.params.id);
  if (!role) throw NotFound('Role not found');
  if (['admin', 'doctor', 'assistant'].includes(role.name)) {
    throw Forbidden('Cannot rename system roles');
  }
  const body = req.body as z.infer<typeof updateSchema>;
  if (body.name) role.name = body.name;
  if (body.description !== undefined) role.description = body.description;
  await role.save();
  const fresh = await Role.findByPk(role.id, includePermissions);
  res.json({ data: serializeRole(fresh!) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const role = await Role.findByPk(req.params.id);
  if (!role) throw NotFound('Role not found');
  if (['admin', 'doctor', 'assistant'].includes(role.name)) {
    throw Forbidden('Cannot delete system roles');
  }
  await role.destroy();
  res.status(204).end();
}

export const setPermissionsSchema = z.object({ permissionIds: z.array(z.string().uuid()) });

export async function setPermissions(req: Request, res: Response): Promise<void> {
  const role = await Role.findByPk(req.params.id);
  if (!role) throw NotFound('Role not found');
  const { permissionIds } = req.body as z.infer<typeof setPermissionsSchema>;
  await RolePermission.destroy({ where: { roleId: role.id } });
  if (permissionIds.length) {
    await RolePermission.bulkCreate(
      permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
    );
  }
  const fresh = await Role.findByPk(role.id, includePermissions);
  res.json({ data: serializeRole(fresh!) });
}
