import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, LogIn, Pencil, Plus, Power } from "lucide-react";
import { toast } from "sonner";
import { ensureRole } from "@/lib/auth-guard";
import { api, type TenantDTO } from "@/lib/api";
import { usePlatformTenant } from "@/lib/platformTenant";
import { ConsultorioFormDialog } from "@/components/platform/ConsultorioFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/consultorios")({
  head: () => ({ meta: [{ title: "Consultorios — MediFlow" }] }),
  beforeLoad: () => ensureRole("platform_admin"),
  component: ConsultoriosPage,
});

const QK = ["platform", "tenants"] as const;

function ConsultoriosPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { enteredTenant, enterTenant, exitTenant } = usePlatformTenant();
  const tenantsQ = useQuery({ queryKey: QK, queryFn: () => api.tenants.list() });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TenantDTO | null>(null);
  const [deactivating, setDeactivating] = useState<TenantDTO | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: QK });

  const deactivateM = useMutation({
    mutationFn: (id: string) => api.tenants.deactivate(id),
    onSuccess: () => {
      invalidate();
      setDeactivating(null);
      toast.success("Consultorio dado de baja");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (t: TenantDTO) => {
    setEditing(t);
    setDialogOpen(true);
  };

  const handleEnter = (t: TenantDTO) => {
    enterTenant(t);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {enteredTenant && (
        <div className="rounded-xl border bg-slate-700/10 border-slate-300 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span>
            Dentro de: <strong>{enteredTenant.clinicName}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              exitTenant();
            }}
            className="text-primary font-medium hover:underline"
          >
            Salir del consultorio
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold inline-flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Consultorios
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crea y administra los consultorios de la plataforma
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Nuevo consultorio
        </button>
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-surface/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Clínica</th>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Creado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenantsQ.isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-muted-foreground">
                    Cargando consultorios…
                  </td>
                </tr>
              )}
              {!tenantsQ.isLoading && (tenantsQ.data?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-muted-foreground">
                    No hay consultorios registrados.
                  </td>
                </tr>
              )}
              {tenantsQ.data?.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{t.slug}</td>
                  <td className="px-4 py-3 font-medium">{t.clinicName}</td>
                  <td className="px-4 py-3">{t.doctorName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.adminEmail ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex text-xs font-medium rounded-full px-2 py-0.5 ${
                        t.active ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {t.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {t.active && (
                        <button
                          type="button"
                          onClick={() => handleEnter(t)}
                          className="p-2 rounded-lg hover:bg-surface text-primary"
                          aria-label="Entrar al consultorio"
                          title="Entrar al consultorio"
                        >
                          <LogIn className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        className="p-2 rounded-lg hover:bg-surface"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {t.active && (
                        <button
                          type="button"
                          onClick={() => setDeactivating(t)}
                          className="p-2 rounded-lg text-destructive hover:bg-destructive/10"
                          aria-label="Dar de baja"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConsultorioFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        tenant={editing}
        onSaved={() => {
          invalidate();
          setDialogOpen(false);
          setEditing(null);
        }}
      />

      <AlertDialog open={!!deactivating} onOpenChange={(o) => !o && setDeactivating(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Dar de baja este consultorio?</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivating
                ? `Se desactivará "${deactivating.clinicName}" y todos sus usuarios perderán acceso. Los datos se conservan.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deactivating && deactivateM.mutate(deactivating.id)}
            >
              Dar de baja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
