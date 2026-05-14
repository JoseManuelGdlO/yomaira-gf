import { createFileRoute } from "@tanstack/react-router";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { useState } from "react";
import { useClinicalForm, type QuestionType } from "@/lib/clinicalForm";
import { Plus, Trash2, ClipboardList } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — MedFlow" }] }),
  component: ConfigPage,
});

function ConfigPage() {
  const { branding } = useBranding();
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-semibold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Datos del consultorio y cuenta</p>
      </div>
      <div className="bg-card border rounded-2xl p-6 space-y-3">
        <Row label="Consultorio" value={branding.clinicName} />
        <Row label="Doctor" value={branding.doctorName} />
        <Row label="Especialidad" value={branding.specialty} />
        <Row label="Cédula profesional" value={branding.cedula} />
        <Row label="Email" value={branding.email} />
        <Row label="Teléfono" value={branding.phone} />
        <Row label="Dirección" value={branding.address} />
      </div>
      <p className="text-xs text-muted-foreground">Para editar la identidad visual, ve a Personalización.</p>

      <ClinicalQuestionsEditor />
    </div>
  );
}

function ClinicalQuestionsEditor() {
  const { questions, customQuestions, addQuestion, removeQuestion } = useClinicalForm();
  const [label, setLabel] = useState("");
  const [section, setSection] = useState("");
  const [type, setType] = useState<QuestionType>("text");
  const [options, setOptions] = useState("");

  const builtinSections = Array.from(new Set(questions.filter((q) => q.builtin).map((q) => q.section)));

  const submit = () => {
    if (!label.trim() || !section.trim()) { toast.error("Completa la sección y la pregunta"); return; }
    addQuestion({
      label: label.trim(),
      section: section.trim(),
      type,
      options: type === "checkbox_group" ? options.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    });
    setLabel(""); setOptions("");
    toast.success("Pregunta agregada");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold inline-flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Preguntas de la historia clínica</h2>
        <p className="text-sm text-muted-foreground mt-1">Personaliza las preguntas que aparecen en el expediente de cada paciente. Las preguntas predeterminadas no se pueden eliminar.</p>
      </div>

      <div className="bg-card border rounded-2xl p-6 space-y-3">
        <div className="font-medium text-sm">Agregar pregunta</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={section} onChange={(e) => setSection(e.target.value)} placeholder="Sección (ej. Hábitos orales)" list="sections" className="h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
          <datalist id="sections">{builtinSections.map((s) => <option key={s} value={s} />)}</datalist>
          <select value={type} onChange={(e) => setType(e.target.value as QuestionType)} className="h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="text">Texto corto</option>
            <option value="textarea">Texto largo</option>
            <option value="yes_no">Sí / No</option>
            <option value="checkbox_group">Selección múltiple</option>
          </select>
        </div>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Pregunta" className="w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
        {type === "checkbox_group" && (
          <input value={options} onChange={(e) => setOptions(e.target.value)} placeholder="Opciones separadas por coma" className="w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
        )}
        <button onClick={submit} className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"><Plus className="h-4 w-4" /> Agregar</button>
      </div>

      <div className="bg-card border rounded-2xl divide-y">
        {customQuestions.length === 0 && <div className="p-4 text-sm text-muted-foreground">Aún no has creado preguntas personalizadas.</div>}
        {customQuestions.map((q) => (
          <div key={q.id} className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{q.label}</div>
              <div className="text-xs text-muted-foreground">{q.section} · {labelForType(q.type)}</div>
            </div>
            <button onClick={() => removeQuestion(q.id)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg" aria-label="Eliminar">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <details className="bg-card border rounded-2xl p-4">
        <summary className="cursor-pointer text-sm font-medium">Ver preguntas predeterminadas ({questions.filter((q) => q.builtin).length})</summary>
        <ul className="mt-3 space-y-1.5 text-sm">
          {questions.filter((q) => q.builtin).map((q) => (
            <li key={q.id} className="flex justify-between gap-3 border-b pb-1.5 last:border-0">
              <span>{q.label}</span>
              <span className="text-xs text-muted-foreground shrink-0">{q.section}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function labelForType(t: QuestionType) {
  return t === "text" ? "Texto" : t === "textarea" ? "Texto largo" : t === "yes_no" ? "Sí / No" : "Selección múltiple";
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
