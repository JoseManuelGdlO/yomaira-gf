import type { PermissionDTO } from "@/lib/api";

export function groupPermissionsByResource(permissions: PermissionDTO[]) {
  const map = new Map<string, PermissionDTO[]>();
  for (const p of permissions) {
    const resource = p.code.split(".")[0] ?? "other";
    const list = map.get(resource) ?? [];
    list.push(p);
    map.set(resource, list);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function resourceLabel(resource: string) {
  const labels: Record<string, string> = {
    users: "Usuarios",
    roles: "Roles",
    patients: "Pacientes",
    appointments: "Citas",
    consultations: "Consultas",
    prescriptions: "Recetas",
    medications: "Medicamentos",
    branding: "Personalización",
    clinical_questions: "Historia clínica",
  };
  return labels[resource] ?? resource;
}
