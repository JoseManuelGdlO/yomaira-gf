/** Permiso mínimo para ver cada sección del menú (null = cualquier usuario autenticado). */
export const NAV_ITEM_PERMISSIONS: Record<string, string | null> = {
  "/dashboard": null,
  "/pacientes": "patients.read",
  "/agenda": "appointments.read",
  "/recetas": "prescriptions.read",
  "/historial": "consultations.read",
  "/consentimiento": "patients.read",
  "/branding": "branding.read",
  "/configuracion": null, // se valida por sección dentro de la página
  "/administracion": null, // users.read | roles.read en AppShell
};

export function canAccessNav(
  path: string,
  hasPermission: (perm: string) => boolean,
  extra?: { administracion?: boolean },
): boolean {
  if (path === "/administracion") return !!extra?.administracion;
  const perm = NAV_ITEM_PERMISSIONS[path];
  if (perm === null || perm === undefined) return true;
  return hasPermission(perm);
}
