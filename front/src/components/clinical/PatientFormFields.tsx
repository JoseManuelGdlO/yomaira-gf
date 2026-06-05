import { useEffect, useState } from "react";
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
  hasAllergies: boolean;
  allergiesDetail: string;
  hasConditions: boolean;
  conditionsDetail: string;
  weightKg: string;
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
    hasAllergies: false,
    allergiesDetail: "",
    hasConditions: false,
    conditionsDetail: "",
    weightKg: "",
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
    hasAllergies: p.allergies.length > 0,
    allergiesDetail: p.allergies.join(", "),
    hasConditions: p.conditions.length > 0,
    conditionsDetail: p.conditions.join(", "),
    weightKg: p.weightKg != null ? String(p.weightKg) : "",
  };
}

export function validatePatientForm(values: PatientFormValues): string | null {
  if (!values.name.trim() || !values.age || !values.guardian.trim()) {
    return "Completa nombre, edad y tutor";
  }
  return null;
}

function splitList(value: string): string[] {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
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
    allergies: values.hasAllergies ? splitList(values.allergiesDetail) : [],
    conditions: values.hasConditions ? splitList(values.conditionsDetail) : [],
    bloodType: values.bloodType,
    weightKg: values.weightKg.trim() ? Number(values.weightKg) : null,
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
  const set = <K extends keyof PatientFormValues>(key: K, value: PatientFormValues[K]) =>
    onChange({ [key]: value });

  return (
    <div className="grid sm:grid-cols-2 gap-4 mt-2">
      <Field label="Nombre completo *" className="sm:col-span-2">
        <input value={values.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="Sofía Martínez Ruiz" />
      </Field>
      <Field label="Edad *">
        <input type="number" min="0" max="120" value={values.age} onChange={(e) => set("age", e.target.value)} className={inputCls} placeholder="6" />
      </Field>
      <Field label="Peso (kg)">
        <input type="number" min="0.5" max="200" step="0.1" value={values.weightKg} onChange={(e) => set("weightKg", e.target.value)} className={inputCls} placeholder="12.5" />
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
      <ListYesNoField
        label="¿Tiene alergias?"
        hasItems={values.hasAllergies}
        detail={values.allergiesDetail}
        onChange={(hasItems, detail) => onChange({ hasAllergies: hasItems, allergiesDetail: detail })}
        placeholder="Penicilina, Látex"
        detailLabel="Especifique las alergias (separadas por coma)"
      />
      <ListYesNoField
        label="¿Tiene antecedentes médicos?"
        hasItems={values.hasConditions}
        detail={values.conditionsDetail}
        onChange={(hasItems, detail) => onChange({ hasConditions: hasItems, conditionsDetail: detail })}
        placeholder="Caries, Mordida cruzada"
        detailLabel="Especifique los antecedentes (separados por coma)"
      />
    </div>
  );
}

function ListYesNoField({
  label,
  detailLabel,
  hasItems,
  detail,
  onChange,
  placeholder,
}: {
  label: string;
  detailLabel: string;
  hasItems: boolean;
  detail: string;
  onChange: (hasItems: boolean, detail: string) => void;
  placeholder: string;
}) {
  const [yes, setYes] = useState(hasItems);
  const [detailValue, setDetailValue] = useState(detail);

  useEffect(() => {
    setYes(hasItems);
    setDetailValue(detail);
  }, [hasItems, detail]);

  return (
    <Field label={label} className="sm:col-span-2">
      <div className="flex gap-2">
        {(["Sí", "No"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => {
              if (opt === "No") {
                setYes(false);
                setDetailValue("");
                onChange(false, "");
              } else {
                setYes(true);
                onChange(true, detailValue);
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
        <div className="mt-2">
          <label className="text-xs font-medium text-muted-foreground">{detailLabel}</label>
          <input
            value={detailValue}
            onChange={(e) => {
              setDetailValue(e.target.value);
              onChange(true, e.target.value);
            }}
            className={`${inputCls} mt-1`}
            placeholder={placeholder}
          />
        </div>
      )}
    </Field>
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
