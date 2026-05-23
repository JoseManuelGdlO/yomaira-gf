import type { PermissionDTO } from "@/lib/api";
import { groupPermissionsByResource, resourceLabel } from "@/lib/adminPermissions";
import { KeyRound } from "lucide-react";

export function PermissionsPanel({ permissions }: { permissions: PermissionDTO[] }) {
  const groups = groupPermissionsByResource(permissions);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Catálogo de permisos del sistema. Se asignan a cada rol desde la pestaña Roles.
      </p>
      <div className="bg-card border rounded-2xl divide-y">
        {groups.map(([resource, items]) => (
          <div key={resource} className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold mb-3">
              <KeyRound className="h-4 w-4 text-primary" />
              {resourceLabel(resource)}
            </div>
            <ul className="space-y-2">
              {items.map((p) => (
                <li key={p.id} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 text-sm border-b last:border-0 pb-2 last:pb-0">
                  <code className="text-xs bg-surface px-2 py-0.5 rounded shrink-0">{p.code}</code>
                  <span className="text-muted-foreground">{p.description ?? "—"}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
