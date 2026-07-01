import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type RoleDTO, type UserDTO } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usePermissionCheck } from "@/lib/usePermissionCheck";
import { Plus, Pencil, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const QK = ["admin", "users"] as const;

export function UsersPanel({ roles }: { roles: RoleDTO[] }) {
  const { user: currentUser } = useAuth();
  const hasPermission = usePermissionCheck();
  const qc = useQueryClient();
  const canWrite = hasPermission("users.write");
  const canDelete = hasPermission("users.delete");

  const usersQ = useQuery({ queryKey: QK, queryFn: () => api.users.list() });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserDTO | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: QK });

  const removeM = useMutation({
    mutationFn: (id: string) => api.users.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Usuario eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (u: UserDTO) => {
    setEditing(u);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {canWrite && (
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Nuevo usuario
        </button>
      )}

      <div className="bg-card border rounded-2xl divide-y">
        {usersQ.isLoading && (
          <div className="p-6 text-sm text-muted-foreground">Cargando usuarios…</div>
        )}
        {!usersQ.isLoading && (usersQ.data?.length ?? 0) === 0 && (
          <div className="p-6 text-sm text-muted-foreground">No hay usuarios.</div>
        )}
        {usersQ.data?.map((u) => (
          <div key={u.id} className="p-4 flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
              <UserCog className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="font-medium">{u.name}</div>
              <div className="text-sm text-muted-foreground">{u.email}</div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {u.roles.map((r) => (
                  <span key={r.id} className="text-xs bg-surface border rounded-full px-2 py-0.5">
                    {r.name}
                  </span>
                ))}
                {!u.active && (
                  <span className="text-xs bg-destructive/10 text-destructive border border-destructive/30 rounded-full px-2 py-0.5">
                    Inactivo
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {canWrite && (
                <button
                  type="button"
                  onClick={() => openEdit(u)}
                  className="p-2 rounded-lg hover:bg-surface"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {canDelete && u.id !== currentUser?.id && (
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm(`¿Eliminar al usuario ${u.name}?`)) return;
                    removeM.mutate(u.id);
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

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        user={editing}
        roles={roles}
        onSaved={() => {
          invalidate();
          setDialogOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

function UserFormDialog({
  open,
  onOpenChange,
  user,
  roles,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: UserDTO | null;
  roles: RoleDTO[];
  onSaved: () => void;
}) {
  const isEdit = !!user;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(true);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPassword("");
      setActive(user.active);
      setRoleIds(user.roles.map((r) => r.id));
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setActive(true);
      setRoleIds([]);
    }
  }, [open, user]);

  const toggleRole = (id: string, checked: boolean) => {
    if (checked) setRoleIds((prev) => [...prev, id]);
    else setRoleIds((prev) => prev.filter((x) => x !== id));
  };

  const save = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Nombre y email son obligatorios");
      return;
    }
    if (!isEdit && password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setSaving(true);
    try {
      if (isEdit && user) {
        const body: { name: string; email: string; active: boolean; password?: string } = {
          name: name.trim(),
          email: email.trim(),
          active,
        };
        if (password) body.password = password;
        await api.users.update(user.id, body);
        await api.users.setRoles(user.id, roleIds);
        toast.success("Usuario actualizado");
      } else {
        await api.users.create({
          name: name.trim(),
          email: email.trim(),
          password,
          active,
          roleIds,
        });
        toast.success("Usuario creado");
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Actualiza datos y roles del usuario." : "Crea una cuenta con acceso al sistema."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Nombre" value={name} onChange={setName} />
          <Field label="Email" value={email} onChange={setEmail} type="email" />
          <Field
            label={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
            value={password}
            onChange={setPassword}
            type="password"
          />
          {isEdit && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={active} onCheckedChange={(v) => setActive(v === true)} />
              Usuario activo
            </label>
          )}
          <div>
            <div className="text-sm font-medium mb-2">Roles</div>
            <div className="space-y-2">
              {roles.map((r) => (
                <label key={r.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={roleIds.includes(r.id)}
                    onCheckedChange={(v) => toggleRole(r.id, v === true)}
                  />
                  <span className="font-medium capitalize">{r.name}</span>
                  {r.description && (
                    <span className="text-muted-foreground text-xs">— {r.description}</span>
                  )}
                </label>
              ))}
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear usuario"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
