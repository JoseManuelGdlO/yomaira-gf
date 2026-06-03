import type { Patient } from "@/mocks/data";

export type PatientFormValues = {
  name: string;
  age: string;
  birthDate: string;
  gender: "M" | "F";
  bloodType: string;
  guardian: string;
  phone: string;
  email: string;
  allergies: string;
  conditions: string;
};

export function emptyPatientForm(): PatientFormValues {
  return {
    name: "",
    age: "",
    birthDate: "",
    gender: "F",
    bloodType: "O+",
    guardian: "",
    phone: "",
    email: "",
    allergies: "",
    conditions: "",
  };
}

export function patientToForm(p: Patient): PatientFormValues {
  return {
    name: p.name,
    age: String(p.age),
    birthDate: p.birthDate,
    gender: p.gender,
    bloodType: p.bloodType,
    guardian: p.guardian,
    phone: p.guardianPhone,
    email: p.email === "—" ? "" : p.email,
    allergies: p.allergies.join(", "),
    conditions: p.conditions.join(", "),
  };
}

export function validatePatientForm(values: PatientFormValues): string | null {
  if (!values.name.trim() || !values.age || !values.guardian.trim()) {
    return "Completa nombre, edad y tutor";
  }
  return null;
}

export function formToPatientFields(values: PatientFormValues, birthDateFallback: string) {
  return {
    name: values.name.trim(),
    age: Number(values.age),
    birthDate: values.birthDate || birthDateFallback,
    gender: values.gender,
    guardian: values.guardian.trim(),
    guardianPhone: values.phone || "+52 55 0000 0000",
    email: values.email || "—",
    allergies: values.allergies.split(",").map((s) => s.trim()).filter(Boolean),
    conditions: values.conditions.split(",").map((s) => s.trim()).filter(Boolean),
    bloodType: values.bloodType,
  };
}

const inputCls = "w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring";

export function PatientFormFields({
  values,
  onChange,
}: {
  values: PatientFormValues;
  onChange: (patch: Partial<PatientFormValues>) => void;
}) {
  const set = (key: keyof PatientFormValues, value: string) => onChange({ [key]: value });

  return (
    <div className="grid sm:grid-cols-2 gap-4 mt-2">
      <Field label="Nombre completo *" className="sm:col-span-2">
        <input value={values.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="Sofía Martínez Ruiz" />
      </Field>
      <Field label="Edad *">
        <input type="number" min="0" max="120" value={values.age} onChange={(e) => set("age", e.target.value)} className={inputCls} placeholder="6" />
      </Field>
      <Field label="Fecha de nacimiento">
        <input type="date" value={values.birthDate} onChange={(e) => set("birthDate", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Género">
        <div className="flex gap-2">
          {(["F", "M"] as const).map((g) => (
            <button key={g} onClick={() => onChange({ gender: g })} type="button" className={`flex-1 h-10 rounded-lg border text-sm font-medium ${values.gender === g ? "bg-primary text-primary-foreground border-primary" : "bg-surface"}`}>
              {g === "F" ? "Femenino" : "Masculino"}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Tipo de sangre">
        <select value={values.bloodType} onChange={(e) => set("bloodType", e.target.value)} className={inputCls}>
          {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((b) => <option key={b}>{b}</option>)}
        </select>
      </Field>
      <Field label="Tutor *" className="sm:col-span-2">
        <input value={values.guardian} onChange={(e) => set("guardian", e.target.value)} className={inputCls} placeholder="Laura Ruiz" />
      </Field>
      <Field label="Teléfono del tutor">
        <input value={values.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} placeholder="+52 55 1234 5678" />
      </Field>
      <Field label="Email">
        <input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="contacto@email.com" />
      </Field>
      <Field label="Alergias (separadas por coma)" className="sm:col-span-2">
        <input value={values.allergies} onChange={(e) => set("allergies", e.target.value)} className={inputCls} placeholder="Penicilina, Látex" />
      </Field>
      <Field label="Antecedentes médicos (separados por coma)" className="sm:col-span-2">
        <input value={values.conditions} onChange={(e) => set("conditions", e.target.value)} className={inputCls} placeholder="Caries, Mordida cruzada" />
      </Field>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
