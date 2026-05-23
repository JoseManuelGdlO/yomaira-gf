import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type PermissionDTO, type RoleDTO } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PermissionPicker } from "./PermissionPicker";

const QK = ["admin", "roles"] as const;
const BUILTIN_ROLES = new Set(["admin", "doctor", "assistant"]);

export function RolesPanel({ permissions }: { permissions: PermissionDTO[] }) {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const canWrite = hasPermission("roles.write");

  const rolesQ = useQuery({ queryKey: QK, queryFn: () => api.roles.list() });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RoleDTO | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: QK });

  const removeM = useMutation({
    mutationFn: (id: string) => api.roles.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Rol eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {canWrite && (
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Nuevo rol
        </button>
      )}

      <div className="bg-card border rounded-2xl divide-y">
        {rolesQ.isLoading && (
          <div className="p-6 text-sm text-muted-foreground">Cargando roles…</div>
        )}
        {rolesQ.data?.map((r) => (
          <div key={r.id} className="p-4 flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-accent/10 text-accent grid place-items-center shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="font-medium capitalize">{r.name}</div>
              {r.description && (
                <div className="text-sm text-muted-foreground">{r.description}</div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                {r.permissions.length} permiso{r.permissions.length === 1 ? "" : "s"}
              </div>
            </div>
            <div className="flex gap-1">
              {canWrite && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(r);
                    setDialogOpen(true);
                  }}
                  className="p-2 rounded-lg hover:bg-surface"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {canWrite && !BUILTIN_ROLES.has(r.name) && (
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm(`¿Eliminar el rol «${r.name}»?`)) return;
                    removeM.mutate(r.id);
                  }}
                  className="p-2 rounded-lg text-destructive hover:bg-destructive/10"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <RoleFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        role={editing}
        permissions={permissions}
        onSaved={() => {
          invalidate();
          setDialogOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

function RoleFormDialog({
  open,
  onOpenChange,
  role,
  permissions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  role: RoleDTO | null;
  permissions: PermissionDTO[];
  onSaved: () => void;
}) {
  const isEdit = !!role;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (role) {
      setName(role.name);
      setDescription(role.description ?? "");
      setPermissionIds(role.permissions.map((p) => p.id));
    } else {
      setName("");
      setDescription("");
      setPermissionIds([]);
    }
  }, [open, role]);

  const save = async () => {
    if (!name.trim()) {
      toast.error("El nombre del rol es obligatorio");
      return;
    }
    setSaving(true);
    try {
      if (isEdit && role) {
        await api.roles.update(role.id, {
          name: name.trim(),
          description: description.trim() || null,
        });
        await api.roles.setPermissions(role.id, permissionIds);
        toast.success("Rol actualizado");
      } else {
        await api.roles.create({
          name: name.trim(),
          description: description.trim() || null,
          permissionIds,
        });
        toast.success("Rol creado");
      }
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar rol" : "Nuevo rol"}</DialogTitle>
          <DialogDescription>Define el nombre y los permisos del rol.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEdit && role && BUILTIN_ROLES.has(role.name)}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Descripción</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Permisos</div>
            <PermissionPicker
              permissions={permissions}
              selectedIds={permissionIds}
              onChange={setPermissionIds}
            />
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear rol"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
