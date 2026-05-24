import { Request, Response } from 'express';
import { z } from 'zod';
import { Permission, Role, RolePermission } from '../models';
import { tenantWhere } from '../middleware/tenant';
import { SYSTEM_ROLE_NAMES } from '../services/tenant/roleTemplates';
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

async function findTenantRole(req: Request, id: string): Promise<Role> {
  const role = await Role.findOne({ where: { id, ...tenantWhere(req) }, ...includePermissions });
  if (!role) throw NotFound('Role not found');
  return role;
}

export async function list(req: Request, res: Response): Promise<void> {
  const roles = await Role.findAll({ where: tenantWhere(req), ...includePermissions, order: [['name', 'ASC']] });
  res.json({ data: roles.map(serializeRole) });
}

export async function get(req: Request, res: Response): Promise<void> {
  const role = await findTenantRole(req, req.params.id);
  res.json({ data: serializeRole(role) });
}

export const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof createSchema>;
  const exists = await Role.findOne({ where: { name: body.name, ...tenantWhere(req) } });
  if (exists) throw Conflict('Role name already exists');
  const role = await Role.create({
    brandingId: req.user!.brandingId,
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
  const role = await findTenantRole(req, req.params.id);
  if (SYSTEM_ROLE_NAMES.includes(role.name as (typeof SYSTEM_ROLE_NAMES)[number])) {
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
  const role = await findTenantRole(req, req.params.id);
  if (SYSTEM_ROLE_NAMES.includes(role.name as (typeof SYSTEM_ROLE_NAMES)[number])) {
    throw Forbidden('Cannot delete system roles');
  }
  await role.destroy();
  res.status(204).end();
}

export const setPermissionsSchema = z.object({ permissionIds: z.array(z.string().uuid()) });

export async function setPermissions(req: Request, res: Response): Promise<void> {
  const role = await findTenantRole(req, req.params.id);
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
