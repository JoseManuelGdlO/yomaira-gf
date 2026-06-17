import { createFileRoute, Link, notFound, useBlocker } from "@tanstack/react-router";
import { fmtShort } from "@/lib/format";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { useStore } from "@/lib/store";
import { DeletePatientDialog } from "@/components/clinical/DeletePatientDialog";
import { EditPatientDialog } from "@/components/clinical/EditPatientDialog";
import { PatientAvatar } from "@/components/clinical/PatientAvatar";
import { ClinicalSheetTab } from "@/components/clinical/ClinicalSheetTab";
import { Phone, Mail, Cake, Droplet, Scale, AlertCircle, FileText, Pill, Plus, Upload, ClipboardList, FileSignature, Camera, Trash2, Eye, Printer, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ClinicalSafetyAlerts } from "@/components/clinical/ClinicalSafetyAlerts";
import { useClinicalSafety } from "@/lib/useClinicalSafety";
import { useClinicalForm, usePatientClinicalAnswers, type Answers, type Question } from "@/lib/clinicalForm";
import { FloatingSaveButton } from "@/components/clinical/FloatingSaveButton";
import { ViewPrescriptionDialog } from "@/components/prescription/ViewPrescriptionDialog";
import type { Patient, Prescription } from "@/mocks/data";

export const Route = createFileRoute("/_app/pacientes/$id")({
  head: ({ params }) => ({ meta: [{ title: `Expediente — MediFlow` }] }),
  component: PatientDetail,
  notFoundComponent: () => <div className="p-8">Paciente no encontrado.</div>,
});

const TABS = ["Hoja clínica", "Resumen", "Historia clínica", "Medicamentos", "Recetas"] as const;
type Tab = typeof TABS[number];

function getUnsavedChangesWarning(
  tab: Tab,
  clinicalSheetDirty: boolean,
  historiaDirty: boolean,
  scope: "tab" | "page",
): string | null {
  const action = scope === "tab" ? "cambiar de pestaña" : "salir";
  if (tab === "Hoja clínica" && clinicalSheetDirty) {
    return `Guarda los cambios de la hoja clínica antes de ${action}`;
  }
  if (tab === "Historia clínica" && historiaDirty) {
    return `Guarda los cambios de la historia clínica antes de ${action}`;
  }
  return null;
}

function PatientDetail() {
  const { id } = Route.useParams();
  const { patients, patientsReady } = useStore();
  const patient = patients.find((p) => p.id === id);

  if (!patientsReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!patient) throw notFound();

  return <PatientDetailContent id={id} patient={patient} />;
}

function PatientDetailContent({ id, patient }: { id: string; patient: Patient }) {
  const { hasPermission } = useAuth();
  const { consultations, prescriptions, updatePatient } = useStore();
  const canDelete = hasPermission("patients.delete");
  const canWrite = hasPermission("patients.write");
  const [tab, setTab] = useState<Tab>("Hoja clínica");
  const [clinicalSheetDirty, setClinicalSheetDirty] = useState(false);
  const [historiaDirty, setHistoriaDirty] = useState(false);
  const [viewRx, setViewRx] = useState<Prescription | null>(null);
  const [rxAutoPrint, setRxAutoPrint] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const patientConsults = consultations.filter((c) => c.patientId === id);
  const patientRx = [...prescriptions.filter((r) => r.patientId === id)].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const { report: safetyReport, isLoading: safetyLoading } = useClinicalSafety(patient.id, "procedure");

  useEffect(() => {
    setClinicalSheetDirty(false);
    setHistoriaDirty(false);
  }, [patient.id]);

  const hasUnsavedChanges =
    (tab === "Hoja clínica" && clinicalSheetDirty) ||
    (tab === "Historia clínica" && historiaDirty);

  const shouldBlockNavigation = useCallback(() => {
    const message = getUnsavedChangesWarning(tab, clinicalSheetDirty, historiaDirty, "page");
    if (!message) return false;
    toast.warning(message);
    return true;
  }, [tab, clinicalSheetDirty, historiaDirty]);

  useBlocker({
    shouldBlockFn: shouldBlockNavigation,
    enableBeforeUnload: hasUnsavedChanges,
  });

  const handleTabChange = (next: Tab) => {
    if (next === tab) return;
    const message = getUnsavedChangesWarning(tab, clinicalSheetDirty, historiaDirty, "tab");
    if (message) {
      toast.warning(message);
      return;
    }
    setTab(next);
  };

  return (
    <div className="space-y-6">
      <Link
        to="/pacientes"
        className="inline-block pb-4 -mb-2 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Pacientes
      </Link>

      {/* Header */}
      <div className="bg-card rounded-2xl border p-6 lg:p-8">
        <div className="flex items-start gap-6 flex-wrap">
          <PatientAvatar patient={patient} size={80} />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl lg:text-3xl font-semibold">{patient.name}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground mt-2">
              <span className="inline-flex items-center gap-1.5"><Cake className="h-4 w-4" /> {patient.age} años · {fmtShort(patient.birthDate)}</span>
              {patient.weightKg != null && (
                <span className="inline-flex items-center gap-1.5"><Scale className="h-4 w-4" /> {patient.weightKg} kg</span>
              )}
              <span className="inline-flex items-center gap-1.5"><Droplet className="h-4 w-4" /> {patient.bloodType}</span>
              <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" /> {patient.guardianPhone}</span>
              <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" /> {patient.email}</span>
            </div>
            {patient.allergies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {patient.allergies.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full font-medium">
                    <AlertCircle className="h-3 w-3" /> Alergia: {a}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Link to="/recetas/nueva" search={{ patientId: patient.id }} className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/90 shrink-0">
            <Plus className="h-4 w-4" /> Nueva receta
          </Link>
          <Link to="/consentimiento" search={{ patientId: patient.id }} className="inline-flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-accent/10 shrink-0">
            <FileSignature className="h-4 w-4" /> Consentimiento
          </Link>
          {canWrite && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-accent/10 shrink-0"
            >
              <Pencil className="h-4 w-4" /> Editar
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-2 border border-destructive/30 text-destructive rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-destructive/10 shrink-0"
            >
              <Trash2 className="h-4 w-4" /> Eliminar paciente
            </button>
          )}
        </div>
      </div>

      <ClinicalSafetyAlerts report={safetyReport} loading={safetyLoading} title="Alertas clínicas del paciente" />

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => handleTabChange(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      <div>
        {tab === "Hoja clínica" && (
          <ClinicalSheetTab patientId={patient.id} consultations={patientConsults} onDirtyChange={setClinicalSheetDirty} />
        )}

        {tab === "Resumen" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Section
              title="Datos generales"
              action={canWrite ? (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar datos
                </button>
              ) : undefined}
            >
              <Field label="Tutor" value={patient.guardian} />
              <Field label="Género" value={patient.gender === "F" ? "Femenino" : "Masculino"} />
              <Field label="Fecha de nacimiento" value={fmtShort(patient.birthDate)} />
              <Field label="Peso" value={patient.weightKg != null ? `${patient.weightKg} kg` : "No registrado"} />
              <Field label="Tipo de sangre" value={patient.bloodType} />
            </Section>
            <Section title="Antecedentes médicos">
              {patient.conditions.length === 0 ? <div className="text-sm text-muted-foreground">Sin antecedentes registrados.</div> : (
                <ul className="space-y-2">{patient.conditions.map((c) => <li key={c} className="text-sm bg-surface px-3 py-2 rounded-lg">• {c}</li>)}</ul>
              )}
            </Section>
            <div className="lg:col-span-2">
              <ConsentPhotoCard patientId={patient.id} photo={patient.consentPhoto} onChange={(v: string | undefined) => updatePatient(patient.id, { consentPhoto: v })} />
            </div>
          </div>
        )}

        {tab === "Historia clínica" && <HistoriaClinica patientId={patient.id} onDirtyChange={setHistoriaDirty} />}

        {tab === "Medicamentos" && (
          <div className="space-y-3">
            {patientRx.length === 0 ? <div className="text-sm text-muted-foreground">Sin medicamentos activos.</div> :
              patientRx.flatMap((r) => r.items.map((it, i) => (
                <div key={r.id + i} className="bg-card border rounded-xl p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center"><Pill className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <div className="font-medium">{it.medication}</div>
                    <div className="text-sm text-muted-foreground">{it.dose} · {it.frequency} · {it.duration}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{fmtShort(r.date)}</div>
                </div>
              )))}
          </div>
        )}

        {tab === "Recetas" && (
          <div className="space-y-3">
            {patientRx.length === 0 ? <div className="text-sm text-muted-foreground">Sin recetas emitidas.</div> :
              patientRx.map((r) => (
                <div key={r.id} className="bg-card border rounded-xl p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0"><FileText className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{r.diagnosis || "Receta médica"}</div>
                    <div className="text-sm text-muted-foreground">{r.items.length} medicamentos · {fmtShort(r.date)}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setRxAutoPrint(false); setViewRx(r); }}
                      title="Ver receta"
                      className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRxAutoPrint(true); setViewRx(r); }}
                      title="Imprimir receta"
                      className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <ViewPrescriptionDialog
        prescription={viewRx}
        open={!!viewRx}
        onOpenChange={(o) => {
          if (!o) {
            setViewRx(null);
            setRxAutoPrint(false);
          }
        }}
        autoPrint={rxAutoPrint}
      />

      <DeletePatientDialog
        patient={patient}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      <EditPatientDialog patient={patient} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

const DETAIL_YES_NO_FIELDS: Record<string, { placeholder: string }> = {
  current_treatment: { placeholder: "Describa el tratamiento o medicación actual" },
  hospitalized: { placeholder: "Describa motivo, fecha o detalles de la hospitalización" },
  surgery: { placeholder: "Describa el tipo de intervención o detalles quirúrgicos" },
  bottle: { placeholder: "Describa uso o duración del biberón" },
  formula: { placeholder: "Describa consumo de leche de fórmula" },
  breast_milk: { placeholder: "Describa consumo de leche materna" },
  pacifier: { placeholder: "Describa uso de chupón o succión digital" },
  lip_biting: { placeholder: "Describa el hábito de succión o mordida de labios" },
  speech: { placeholder: "Describa la alteración en el habla observada" },
  complementary_feeding: { placeholder: "Describa la alimentación complementaria" },
};

const YES_PENDING_MARKER = "Sí";

function isYesPendingMarker(value: string): boolean {
  return /^s[ií]$/i.test(value.trim());
}

function toStoredDetail(displayDetail: string): string {
  return displayDetail.trim() ? displayDetail : YES_PENDING_MARKER;
}

function toDisplayDetail(stored: string): string {
  return isYesPendingMarker(stored) ? "" : stored;
}

function parseDetailYesNoValue(value: string | undefined): { yes: boolean; detail: string } {
  const trimmed = (value ?? "").trim();
  const negative = /^(no|ninguno|n\/a|na|—|-)$/i;
  if (!trimmed || negative.test(trimmed)) return { yes: false, detail: "" };
  return { yes: true, detail: trimmed };
}

function normalizeDetailAnswers(answers: Answers): Answers {
  const normalized = { ...answers };
  for (const code of Object.keys(DETAIL_YES_NO_FIELDS)) {
    if (typeof normalized[code] === "string") {
      const parsed = parseDetailYesNoValue(normalized[code]);
      if (!parsed.yes || isYesPendingMarker(parsed.detail)) {
        normalized[code] = "";
      } else {
        normalized[code] = parsed.detail;
      }
    }
  }
  return normalized;
}

function DetailYesNoField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  const parsed = parseDetailYesNoValue(value);
  const [yes, setYes] = useState(parsed.yes);
  const [detail, setDetail] = useState(() => toDisplayDetail(parsed.detail));

  useEffect(() => {
    const next = parseDetailYesNoValue(value);
    setYes(next.yes);
    setDetail(toDisplayDetail(next.detail));
  }, [value]);

  return (
    <div className="md:col-span-2">
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <div className="flex gap-2">
        {(["Sí", "No"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => {
              if (opt === "No") {
                setYes(false);
                setDetail("");
                onChange("");
              } else {
                setYes(true);
                onChange(toStoredDetail(detail));
              }
            }}
            className={`px-4 h-10 rounded-lg border text-sm font-medium transition-colors ${
              (opt === "Sí" ? yes : !yes)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-surface hover:bg-accent/10"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {yes && (
        <textarea
          value={detail}
          onChange={(e) => {
            const next = e.target.value;
            setDetail(next);
            onChange(toStoredDetail(next));
          }}
          rows={3}
          placeholder={placeholder}
          className="w-full p-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring resize-y mt-2"
        />
      )}
    </div>
  );
}

function HistoriaClinica({ patientId, onDirtyChange }: { patientId: string; onDirtyChange?: (dirty: boolean) => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { questions, saveAnswers } = useClinicalForm();
  const answersQ = usePatientClinicalAnswers(patientId);
  const [draft, setDraft] = useState<Answers>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const syncedPatient = useRef<string | null>(null);
  const sections = Array.from(new Set(questions.map((q) => q.section)));

  useEffect(() => {
    syncedPatient.current = null;
    setDirty(false);
  }, [patientId]);

  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!answersQ.data || dirty) return;
    const normalized = normalizeDetailAnswers(answersQ.data);
    if (syncedPatient.current !== patientId) {
      syncedPatient.current = patientId;
      setDraft(normalized);
      return;
    }
    setDraft(normalized);
  }, [patientId, answersQ.data, dirty]);

  const setAnswer = (qid: string, value: string | string[]) => {
    setDraft((prev) => ({ ...prev, [qid]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toSave = normalizeDetailAnswers(draft);
      await saveAnswers(patientId, toSave);
      setDraft(toSave);
      setDirty(false);
      qc.invalidateQueries({ queryKey: tenantKey(["clinical-safety", patientId], user?.brandingId) });
      toast.success("Historia clínica guardada");
    } catch {
      toast.error("No se pudo guardar la historia clínica");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-display text-lg font-semibold inline-flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Historia clínica</h3>
          <p className="text-sm text-muted-foreground mt-1">Edita los campos y pulsa Guardar cuando termines.</p>
        </div>
        <Link to="/configuracion" className="text-sm text-primary font-medium hover:underline">+ Editar preguntas</Link>
      </div>
      {sections.map((s) => (
        <div key={s} className="bg-card border rounded-2xl p-6 space-y-4">
          <div className="font-display font-semibold">{s}</div>
          <div className="grid md:grid-cols-2 gap-4">
            {questions.filter((q) => q.section === s).map((q) => {
              const detailConfig = DETAIL_YES_NO_FIELDS[q.id];
              if (detailConfig) {
                return (
                  <DetailYesNoField
                    key={q.id}
                    label={q.label}
                    placeholder={detailConfig.placeholder}
                    value={draft[q.id] as string | undefined}
                    onChange={(v) => setAnswer(q.id, v)}
                  />
                );
              }
              return (
                <QuestionField key={q.id} q={q} value={draft[q.id]} onChange={(v) => setAnswer(q.id, v)} />
              );
            })}
          </div>
        </div>
      ))}
      <FloatingSaveButton visible={dirty} saving={saving} onClick={handleSave} />
    </div>
  );
}

function QuestionField({ q, value, onChange }: { q: Question; value: string | string[] | undefined; onChange: (v: string | string[]) => void }) {
  const wrap = q.type === "textarea" || q.type === "checkbox_group" ? "md:col-span-2" : "";
  return (
    <div className={wrap}>
      <label className="text-sm font-medium block mb-1.5">{q.label}</label>
      {q.type === "text" && (
        <input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
      )}
      {q.type === "textarea" && (
        <textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full p-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring resize-y" />
      )}
      {q.type === "yes_no" && (
        <div className="flex gap-2">
          {["Sí", "No"].map((opt) => (
            <button key={opt} type="button" onClick={() => onChange(opt)} className={`px-4 h-10 rounded-lg border text-sm font-medium transition-colors ${value === opt ? "bg-primary text-primary-foreground border-primary" : "bg-surface hover:bg-accent/10"}`}>{opt}</button>
          ))}
        </div>
      )}
      {q.type === "checkbox_group" && (
        <div className="flex flex-wrap gap-2">
          {q.options?.map((opt) => {
            const arr = Array.isArray(value) ? value : [];
            const checked = arr.includes(opt);
            return (
              <button key={opt} type="button" onClick={() => onChange(checked ? arr.filter((x) => x !== opt) : [...arr, opt])} className={`px-3 h-9 rounded-lg border text-sm transition-colors ${checked ? "bg-primary text-primary-foreground border-primary" : "bg-surface hover:bg-accent/10"}`}>{opt}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConsentPhotoCard({ patientId, photo, onChange }: { patientId: string; photo?: string; onChange: (v: string | undefined) => void }) {
  const inputRef = (typeof document !== "undefined" ? null : null);
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Selecciona una imagen"); return; }
    const reader = new FileReader();
    reader.onload = () => { onChange(reader.result as string); toast.success("Consentimiento cargado"); };
    reader.readAsDataURL(file);
  };
  return (
    <div className="bg-card border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h3 className="font-display text-lg font-semibold inline-flex items-center gap-2"><FileSignature className="h-5 w-5 text-primary" /> Consentimiento informado firmado</h3>
          <p className="text-sm text-muted-foreground mt-1">Sube la foto del documento firmado por el tutor.</p>
        </div>
        <Link to="/consentimiento" search={{ patientId }} className="text-sm text-primary font-medium hover:underline">Imprimir formato →</Link>
      </div>
      {photo ? (
        <div className="space-y-3">
          <div className="border rounded-xl overflow-hidden bg-surface">
            <img src={photo} alt="Consentimiento firmado" className="w-full max-h-[480px] object-contain" />
          </div>
          <div className="flex gap-2">
            <label className="inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium cursor-pointer hover:bg-accent/10">
              <Camera className="h-4 w-4" /> Reemplazar
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
            <button onClick={() => { onChange(undefined); toast.success("Consentimiento eliminado"); }} className="inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" /> Quitar
            </button>
          </div>
        </div>
      ) : (
        <label className="border-2 border-dashed rounded-2xl p-10 text-center block cursor-pointer hover:bg-surface/60 transition-colors">
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <div className="font-medium">Cargar foto del consentimiento</div>
          <div className="text-sm text-muted-foreground mt-1">PNG, JPG o HEIC desde la cámara o el dispositivo</div>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
      )}
    </div>
  );
}
