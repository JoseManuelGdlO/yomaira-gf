import { v4 as uuid } from 'uuid';
import { Permission, Role, RolePermission } from '../../models';
import { ROLE_TEMPLATES } from './roleTemplates';

export async function seedTenantRoles(brandingId: string): Promise<Record<string, string>> {
  const permissions = await Permission.findAll();
  const permByCode = Object.fromEntries(permissions.map((p) => [p.code, p.id]));
  const roleByName: Record<string, string> = {};

  for (const [name, def] of Object.entries(ROLE_TEMPLATES)) {
    const role = await Role.create({
      id: uuid(),
      brandingId,
      name,
      description: def.description,
    });
    roleByName[name] = role.id;

    const rows = def.permissions
      .filter((code) => permByCode[code])
      .map((code) => ({
        roleId: role.id,
        permissionId: permByCode[code],
      }));
    if (rows.length) await RolePermission.bulkCreate(rows);
  }

  return roleByName;
}
