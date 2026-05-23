import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { ensureAnyPermission } from "@/lib/auth-guard";
import { useAuth } from "@/lib/auth";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { useEffect, useMemo, useState } from "react";
import { useClinicalForm, type Question, type QuestionType } from "@/lib/clinicalForm";
import { Plus, Trash2, ClipboardList, Building2, Save, Bell, Calendar } from "lucide-react";
import { toast } from "sonner";
import { api, type NotificationPreferencesDTO } from "@/lib/api";
import {
  isPushSupported,
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/pushNotifications";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — MedFlow" }] }),
  beforeLoad: () =>
    ensureAnyPermission(
      "branding.read",
      "branding.write",
      "clinical_questions.read",
      "clinical_questions.write",
    ),
  component: ConfigPage,
});

function ConfigPage() {
  const { hasPermission } = useAuth();
  const canEditClinic = hasPermission("branding.write");
  const canEditQuestions = hasPermission("clinical_questions.write");

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-semibold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Datos del consultorio y preguntas del expediente</p>
      </div>

      <NotificationsPanel />

      {(hasPermission("branding.read") || canEditClinic) && (
        <ClinicDataEditor readOnly={!canEditClinic} />
      )}
      {(hasPermission("clinical_questions.read") || canEditQuestions) && (
        <ClinicalQuestionsEditor readOnly={!canEditQuestions} />
      )}

      <p className="text-xs text-muted-foreground">
        Para colores, logo y carta de consentimiento, ve a{" "}
        <Link to="/branding" className="text-primary font-medium hover:underline">
          Personalización
        </Link>
        .
      </p>
    </div>
  );
}

function ClinicDataEditor({ readOnly }: { readOnly?: boolean }) {
  const { branding, updateBranding } = useBranding();
  const [form, setForm] = useState({
    clinicName: branding.clinicName,
    doctorName: branding.doctorName,
    specialty: branding.specialty,
    cedula: branding.cedula,
    email: branding.email,
    phone: branding.phone,
    address: branding.address,
  });

  useEffect(() => {
    setForm({
      clinicName: branding.clinicName,
      doctorName: branding.doctorName,
      specialty: branding.specialty,
      cedula: branding.cedula,
      email: branding.email,
      phone: branding.phone,
      address: branding.address,
    });
  }, [
    branding.id,
    branding.clinicName,
    branding.doctorName,
    branding.specialty,
    branding.cedula,
    branding.email,
    branding.phone,
    branding.address,
  ]);

  const set = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    if (readOnly) return;
    if (!form.clinicName.trim() || !form.doctorName.trim()) {
      toast.error("Nombre del consultorio y doctor son obligatorios");
      return;
    }
    updateBranding({
      clinicName: form.clinicName.trim(),
      doctorName: form.doctorName.trim(),
      specialty: form.specialty.trim(),
      cedula: form.cedula.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    });
    toast.success("Datos del consultorio guardados");
  };

  return (
    <div className="bg-card border rounded-2xl p-6 space-y-4">
      <h2 className="font-display text-xl font-semibold inline-flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" /> Datos del consultorio
      </h2>
      {readOnly && (
        <p className="text-sm text-muted-foreground">Solo lectura — requiere permiso branding.write</p>
      )}
      <div className={`grid sm:grid-cols-2 gap-3 ${readOnly ? "pointer-events-none opacity-70" : ""}`}>
        <Field label="Nombre del consultorio" value={form.clinicName} onChange={(v) => set("clinicName", v)} />
        <Field label="Doctor(a)" value={form.doctorName} onChange={(v) => set("doctorName", v)} />
        <Field label="Especialidad" value={form.specialty} onChange={(v) => set("specialty", v)} />
        <Field label="Cédula profesional" value={form.cedula} onChange={(v) => set("cedula", v)} />
        <Field label="Email" value={form.email} onChange={(v) => set("email", v)} type="email" />
        <Field label="Teléfono" value={form.phone} onChange={(v) => set("phone", v)} />
      </div>
      <Field label="Dirección" value={form.address} onChange={(v) => set("address", v)} />
      {!readOnly && (
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <Save className="h-4 w-4" /> Guardar datos
        </button>
      )}
    </div>
  );
}

function ClinicalQuestionsEditor({ readOnly }: { readOnly?: boolean }) {
  const { questions, addQuestion, removeQuestion } = useClinicalForm();
  const [label, setLabel] = useState("");
  const [section, setSection] = useState("");
  const [type, setType] = useState<QuestionType>("text");
  const [options, setOptions] = useState("");

  const sections = useMemo(() => Array.from(new Set(questions.map((q) => q.section))), [questions]);

  const questionsBySection = useMemo(() => {
    const map = new Map<string, Question[]>();
    for (const q of questions) {
      const list = map.get(q.section) ?? [];
      list.push(q);
      map.set(q.section, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [questions]);

  const submit = () => {
    if (readOnly) return;
    if (!label.trim() || !section.trim()) {
      toast.error("Completa la sección y la pregunta");
      return;
    }
    addQuestion({
      label: label.trim(),
      section: section.trim(),
      type,
      options: type === "checkbox_group" ? options.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    });
    setLabel("");
    setOptions("");
    toast.success("Pregunta agregada");
  };

  const handleRemove = (q: Question) => {
    if (readOnly) return;
    const kind = q.builtin ? "predeterminada" : "personalizada";
    if (!window.confirm(`¿Eliminar la pregunta ${kind} «${q.label}»?`)) return;
    removeQuestion(q.id, () => toast.success("Pregunta eliminada"));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold inline-flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" /> Preguntas de la historia clínica
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Administra las preguntas del expediente. Puedes eliminar las predeterminadas que no uses y agregar las tuyas.
        </p>
      </div>

      {readOnly && (
        <p className="text-sm text-muted-foreground">Solo lectura — requiere permiso clinical_questions.write</p>
      )}

      {!readOnly && (
      <div className="bg-card border rounded-2xl p-6 space-y-3">
        <div className="font-medium text-sm">Agregar pregunta</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="Sección (ej. Hábitos orales)"
            list="sections"
            className="h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <datalist id="sections">
            {sections.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
            className="h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="text">Texto corto</option>
            <option value="textarea">Texto largo</option>
            <option value="yes_no">Sí / No</option>
            <option value="checkbox_group">Selección múltiple</option>
          </select>
        </div>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Pregunta"
          className="w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {type === "checkbox_group" && (
          <input
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="Opciones separadas por coma"
            className="w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        )}
        <button
          type="button"
          onClick={submit}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>
      )}

      <div className="bg-card border rounded-2xl divide-y">
        {questions.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">
            No hay preguntas activas. Agrega las que necesites para el expediente.
          </div>
        )}
        {questionsBySection.map(([sectionName, items]) => (
          <div key={sectionName} className="p-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{sectionName}</div>
            {items.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-4 pl-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{q.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {labelForType(q.type)}
                    {q.builtin ? " · Predeterminada" : " · Personalizada"}
                  </div>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemove(q)}
                    className="text-destructive hover:bg-destructive/10 p-2 rounded-lg shrink-0"
                    aria-label="Eliminar pregunta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsPanel() {
  const search = useSearch({ strict: false }) as { google?: string };
  const [prefs, setPrefs] = useState<NotificationPreferencesDTO | null>(null);
  const [google, setGoogle] = useState<{ connected: boolean; configured: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    void registerServiceWorker();
  }, []);

  useEffect(() => {
    if (search.google === "connected") toast.success("Google Calendar conectado");
    if (search.google === "error") toast.error("No se pudo conectar Google Calendar");
  }, [search.google]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, g] = await Promise.all([
          api.notifications.getPreferences(),
          api.integrations.googleStatus(),
        ]);
        if (!cancelled) {
          setPrefs(p);
          setGoogle({ connected: g.connected, configured: g.configured });
        }
      } catch {
        if (!cancelled) toast.error("No se pudieron cargar las notificaciones");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const savePrefs = async (patch: Partial<NotificationPreferencesDTO>) => {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      const updated = await api.notifications.updatePreferences(patch);
      setPrefs({ ...next, ...updated });
      toast.success("Preferencias guardadas");
    } catch {
      setPrefs(prefs);
      toast.error("Error al guardar preferencias");
    }
  };

  const connectGoogle = async () => {
    try {
      const { url } = await api.integrations.googleConnect();
      window.location.href = url;
    } catch {
      toast.error("Google Calendar no está configurado en el servidor");
    }
  };

  const disconnectGoogle = async () => {
    try {
      await api.integrations.googleDisconnect();
      setGoogle((g) => (g ? { ...g, connected: false } : g));
      toast.success("Google Calendar desconectado");
    } catch {
      toast.error("Error al desconectar");
    }
  };

  const enablePush = async () => {
    setPushBusy(true);
    try {
      const key = prefs?.vapidPublicKey ?? undefined;
      const ok = await subscribeToPush(key ?? undefined);
      if (ok) toast.success("Notificaciones push activadas en este navegador");
      else toast.info("Permiso de notificaciones denegado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al activar push");
    } finally {
      setPushBusy(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-card rounded-2xl border p-6">
        <p className="text-sm text-muted-foreground">Cargando notificaciones…</p>
      </section>
    );
  }

  if (!prefs) return null;

  return (
    <section className="bg-card rounded-2xl border p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-semibold">Notificaciones</h2>
      </div>
      <p className="text-sm text-muted-foreground -mt-4">
        Correo y avisos del navegador al crear, confirmar o cancelar citas.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="email-enabled">Correo electrónico</Label>
          <Switch
            id="email-enabled"
            checked={prefs.emailEnabled}
            onCheckedChange={(v) => void savePrefs({ emailEnabled: v })}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="push-enabled">Notificaciones push</Label>
          <Switch
            id="push-enabled"
            checked={prefs.pushEnabled}
            onCheckedChange={(v) => void savePrefs({ pushEnabled: v })}
          />
        </div>
        <div className="flex items-center justify-between gap-4 pl-2 border-l-2">
          <Label className="text-muted-foreground">Nueva cita</Label>
          <Switch
            checked={prefs.onAppointmentCreated}
            onCheckedChange={(v) => void savePrefs({ onAppointmentCreated: v })}
          />
        </div>
        <div className="flex items-center justify-between gap-4 pl-2 border-l-2">
          <Label className="text-muted-foreground">Cita confirmada</Label>
          <Switch
            checked={prefs.onAppointmentConfirmed}
            onCheckedChange={(v) => void savePrefs({ onAppointmentConfirmed: v })}
          />
        </div>
        <div className="flex items-center justify-between gap-4 pl-2 border-l-2">
          <Label className="text-muted-foreground">Cita cancelada</Label>
          <Switch
            checked={prefs.onAppointmentCancelled}
            onCheckedChange={(v) => void savePrefs({ onAppointmentCancelled: v })}
          />
        </div>
      </div>

      {isPushSupported() && prefs.pushConfigured ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pushBusy}
            onClick={() => void enablePush()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Activar notificaciones en este navegador
          </button>
          <button
            type="button"
            onClick={() => void unsubscribeFromPush().then(() => toast.success("Push desactivado"))}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm hover:bg-surface"
          >
            Desactivar en este navegador
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Push no disponible: configure VAPID en el servidor o use HTTPS en producción.
        </p>
      )}

      <div className="border-t pt-6 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Google Calendar</h3>
        </div>
        {!google?.configured ? (
          <p className="text-sm text-muted-foreground">
            OAuth de Google no configurado en el servidor (GOOGLE_CLIENT_ID).
          </p>
        ) : google.connected ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-green-700 dark:text-green-400 font-medium">Conectado</span>
            <button
              type="button"
              onClick={() => void disconnectGoogle()}
              className="text-sm rounded-lg border px-3 py-1.5 hover:bg-surface"
            >
              Desconectar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void connectGoogle()}
            className="text-sm rounded-xl bg-surface border px-4 py-2 font-medium hover:bg-muted"
          >
            Conectar con Google
          </button>
        )}
      </div>
    </section>
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

function labelForType(t: QuestionType) {
  return t === "text" ? "Texto" : t === "textarea" ? "Texto largo" : t === "yes_no" ? "Sí / No" : "Selección múltiple";
}
