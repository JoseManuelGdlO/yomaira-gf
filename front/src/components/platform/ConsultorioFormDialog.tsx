import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, type CreateTenantInput, type TenantDTO, type UpdateTenantInput } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantDTO | null;
  onSaved: () => void;
};

export function ConsultorioFormDialog({ open, onOpenChange, tenant, onSaved }: Props) {
  const isEdit = !!tenant;
  const [slug, setSlug] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("Medicina general");
  const [email, setEmail] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (tenant) {
      setSlug(tenant.slug);
      setClinicName(tenant.clinicName);
      setDoctorName(tenant.doctorName);
      setSpecialty(tenant.specialty);
      setEmail(tenant.email);
      setAdminEmail(tenant.adminEmail ?? "");
      setAdminPassword("");
    } else {
      setSlug("");
      setClinicName("");
      setDoctorName("");
      setSpecialty("Medicina general");
      setEmail("");
      setAdminEmail("");
      setAdminPassword("");
    }
  }, [open, tenant]);

  const save = async () => {
    if (!clinicName.trim() || !doctorName.trim()) {
      toast.error("Nombre de clínica y doctor son obligatorios");
      return;
    }

    if (!isEdit) {
      if (!slug.trim() || !adminEmail.trim() || adminPassword.length < 8) {
        toast.error("Slug, email admin y contraseña (mín. 8 caracteres) son obligatorios");
        return;
      }
    } else if (adminPassword && adminPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && tenant) {
        const body: UpdateTenantInput = {
          clinicName: clinicName.trim(),
          doctorName: doctorName.trim(),
          specialty: specialty.trim(),
          email: email.trim() || undefined,
        };
        if (adminPassword) body.adminPassword = adminPassword;
        await api.tenants.update(tenant.id, body);
        toast.success("Consultorio actualizado");
      } else {
        const body: CreateTenantInput = {
          slug: slug.trim().toLowerCase(),
          clinicName: clinicName.trim(),
          doctorName: doctorName.trim(),
          specialty: specialty.trim() || "Medicina general",
          adminEmail: adminEmail.trim(),
          adminPassword,
        };
        await api.tenants.create(body);
        toast.success("Consultorio creado");
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
          <DialogTitle>{isEdit ? "Editar consultorio" : "Nuevo consultorio"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos del consultorio. El slug no se puede cambiar."
              : "Crea un consultorio con su usuario administrador inicial."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field
            label="Slug"
            value={slug}
            onChange={setSlug}
            disabled={isEdit}
            hint={isEdit ? undefined : "Solo minúsculas, números y guiones (ej. drgarcia)"}
          />
          <Field label="Nombre de la clínica" value={clinicName} onChange={setClinicName} />
          <Field label="Doctor(a)" value={doctorName} onChange={setDoctorName} />
          <Field label="Especialidad" value={specialty} onChange={setSpecialty} />
          {isEdit ? (
            <Field label="Email de contacto" value={email} onChange={setEmail} type="email" />
          ) : null}
          {!isEdit ? (
            <>
              <Field label="Email del admin" value={adminEmail} onChange={setAdminEmail} type="email" />
              <Field
                label="Contraseña del admin"
                value={adminPassword}
                onChange={setAdminPassword}
                type="password"
              />
            </>
          ) : (
            <>
              <div className="text-sm">
                <span className="font-medium">Email admin: </span>
                <span className="text-muted-foreground">{adminEmail || "—"}</span>
              </div>
              <Field
                label="Nueva contraseña del admin (opcional)"
                value={adminPassword}
                onChange={setAdminPassword}
                type="password"
              />
            </>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear consultorio"}
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
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
      />
      {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
    </div>
  );
}
