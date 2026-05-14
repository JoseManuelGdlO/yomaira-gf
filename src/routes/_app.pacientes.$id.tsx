import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { fmtShort } from "@/lib/format";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PatientAvatar } from "@/components/clinical/PatientAvatar";
import { ClinicalTimeline } from "@/components/clinical/ClinicalTimeline";
import { Phone, Mail, Cake, Droplet, AlertCircle, FileText, Pill, Plus, Upload, Edit2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pacientes/$id")({
  head: ({ params }) => ({ meta: [{ title: `Expediente — MedFlow` }] }),
  component: PatientDetail,
  notFoundComponent: () => <div className="p-8">Paciente no encontrado.</div>,
});

const TABS = ["Resumen", "Historial", "Diagnósticos", "Medicamentos", "Estudios", "Notas", "Recetas"] as const;
type Tab = typeof TABS[number];

function PatientDetail() {
  const { id } = Route.useParams();
  const { patients, consultations, prescriptions, updatePatient } = useStore();
  const patient = patients.find((p) => p.id === id);
  if (!patient) throw notFound();

  const [tab, setTab] = useState<Tab>("Resumen");
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState("");
  const patientConsults = consultations.filter((c) => c.patientId === id);
  const patientRx = prescriptions.filter((r) => r.patientId === id);

  return (
    <div className="space-y-6">
      <Link to="/pacientes" className="text-sm text-muted-foreground hover:text-foreground">← Pacientes</Link>

      {/* Header */}
      <div className="bg-card rounded-2xl border p-6 lg:p-8">
        <div className="flex items-start gap-6 flex-wrap">
          <PatientAvatar patient={patient} size={80} />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl lg:text-3xl font-semibold">{patient.name}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground mt-2">
              <span className="inline-flex items-center gap-1.5"><Cake className="h-4 w-4" /> {patient.age} años · {fmtShort(patient.birthDate)}</span>
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
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      <div>
        {tab === "Resumen" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Section title="Datos generales">
              <Field label="Tutor" value={patient.guardian} />
              <Field label="Género" value={patient.gender === "F" ? "Femenino" : "Masculino"} />
              <Field label="Fecha de nacimiento" value={fmtShort(patient.birthDate)} />
              <Field label="Tipo de sangre" value={patient.bloodType} />
            </Section>
            <Section title="Antecedentes médicos">
              {patient.conditions.length === 0 ? <div className="text-sm text-muted-foreground">Sin antecedentes registrados.</div> : (
                <ul className="space-y-2">{patient.conditions.map((c) => <li key={c} className="text-sm bg-surface px-3 py-2 rounded-lg">• {c}</li>)}</ul>
              )}
            </Section>
          </div>
        )}

        {tab === "Historial" && <ClinicalTimeline items={patientConsults} />}

        {tab === "Diagnósticos" && (
          <div className="space-y-3">
            {patientConsults.length === 0 ? <div className="text-sm text-muted-foreground">Sin diagnósticos.</div> :
              patientConsults.map((c) => (
                <div key={c.id} className="bg-card border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{c.diagnosis}</div>
                    <div className="text-xs text-muted-foreground">{fmtShort(c.date)}</div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Tratamiento: {c.treatment}</div>
                </div>
              ))}
          </div>
        )}

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

        {tab === "Estudios" && (
          <div className="border-2 border-dashed rounded-2xl p-12 text-center">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <div className="font-medium">Sube estudios médicos</div>
            <div className="text-sm text-muted-foreground mt-1">Radiografías, panorámicas, fotos clínicas (demo)</div>
            <button onClick={() => toast.success("Archivo cargado (demo)")} className="mt-4 inline-flex bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">Seleccionar archivo</button>
          </div>
        )}

        {tab === "Notas" && (
          <div className="bg-card border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-semibold">Notas del doctor</h3>
              <button onClick={() => { if (editing) { toast.success("Notas guardadas"); } setEditing(!editing); }} className="inline-flex items-center gap-1.5 text-sm text-primary font-medium">
                {editing ? <><Save className="h-4 w-4" /> Guardar</> : <><Edit2 className="h-4 w-4" /> Editar</>}
              </button>
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={!editing} placeholder="Escribe tus notas clínicas aquí..." className="w-full min-h-[200px] p-4 rounded-xl bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring resize-y disabled:opacity-70" />
          </div>
        )}

        {tab === "Recetas" && (
          <div className="space-y-3">
            {patientRx.length === 0 ? <div className="text-sm text-muted-foreground">Sin recetas emitidas.</div> :
              patientRx.map((r) => (
                <div key={r.id} className="bg-card border rounded-xl p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center"><FileText className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <div className="font-medium">{r.diagnosis || "Receta médica"}</div>
                    <div className="text-sm text-muted-foreground">{r.items.length} medicamentos · {fmtShort(r.date)}</div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-2xl p-6">
      <h3 className="font-display text-lg font-semibold mb-4">{title}</h3>
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
