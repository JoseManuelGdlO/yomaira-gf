import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ensureAnyPermission } from "@/lib/auth-guard";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { RolesPanel } from "@/components/admin/RolesPanel";
import { PermissionsPanel } from "@/components/admin/PermissionsPanel";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_app/administracion")({
  head: () => ({ meta: [{ title: "Administración — MedFlow" }] }),
  beforeLoad: () => ensureAnyPermission("users.read", "roles.read"),
  component: AdminPage,
});

type Tab = "usuarios" | "roles" | "permisos";

function AdminPage() {
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState<Tab>(() => {
    if (hasPermission("users.read")) return "usuarios";
    return "roles";
  });

  const rolesQ = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => api.roles.list(),
    enabled: hasPermission("roles.read") || hasPermission("users.read"),
  });

  const permsQ = useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: () => api.permissions.list(),
    enabled: hasPermission("roles.read"),
  });

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "usuarios", label: "Usuarios", show: hasPermission("users.read") },
    { id: "roles", label: "Roles", show: hasPermission("roles.read") },
    { id: "permisos", label: "Permisos", show: hasPermission("roles.read") },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-semibold inline-flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-primary" />
          Administración
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona usuarios, roles y permisos del sistema
        </p>
      </div>

      <div className="bg-surface rounded-xl p-1 flex flex-wrap gap-1">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                tab === t.id ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      {tab === "usuarios" && hasPermission("users.read") && (
        <UsersPanel roles={rolesQ.data ?? []} />
      )}
      {tab === "roles" && hasPermission("roles.read") && (
        <RolesPanel roles={rolesQ.data ?? []} permissions={permsQ.data ?? []} />
      )}
      {tab === "permisos" && hasPermission("roles.read") && (
        <PermissionsPanel permissions={permsQ.data ?? []} />
      )}
    </div>
  );
}
