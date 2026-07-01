import type { UserDTO } from "@/lib/api";

export function hasPermission(permissions: readonly string[] | undefined, key: string): boolean {
  return !!permissions?.includes(key);
}

/** Admin/doctor roles see full clinical scope in UI iconography (vs assistant). */
export function userSeesAllPatients(user: Pick<UserDTO, "roles"> | null | undefined): boolean {
  const names = user?.roles.map((r) => r.name) ?? [];
  return names.includes("admin") || names.includes("doctor");
}

export function userHasPermission(user: Pick<UserDTO, "roles" | "permissions"> | null | undefined, perm: string): boolean {
  if (!user) return false;
  if (user.roles.some((r) => r.name === "admin")) return true;
  return hasPermission(user.permissions, perm);
}
