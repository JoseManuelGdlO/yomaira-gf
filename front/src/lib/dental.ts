/** FDI tooth numbering as on the client's clinical sheet (pediatric practice). */
export const ODONTO_QUADRANTS = [
  {
    label: "Superior derecho",
    primary: ["51", "52", "53", "54", "55"],
    permanent: ["11", "12", "13", "14", "15", "16", "17", "18"],
  },
  {
    label: "Superior izquierdo",
    primary: ["61", "62", "63", "64", "65"],
    permanent: ["21", "22", "23", "24", "25", "26", "27", "28"],
  },
  {
    label: "Inferior izquierdo",
    primary: ["71", "72", "73", "74", "75"],
    permanent: ["31", "32", "33", "34", "35", "36", "37", "38"],
  },
  {
    label: "Inferior derecho",
    primary: ["81", "82", "83", "84", "85"],
    permanent: ["41", "42", "43", "44", "45", "46", "47", "48"],
  },
] as const;

export const FRANKL_OPTIONS = [
  { value: "na", label: "N/A" },
  { value: "I", label: "I" },
  { value: "II", label: "II" },
  { value: "III", label: "III" },
  { value: "IV", label: "IV" },
] as const;

export const DENTITION_OPTIONS = [
  { value: "temporal", label: "Dentición temporal" },
  { value: "mixta", label: "Mixta" },
  { value: "permanente", label: "Permanente" },
] as const;

export function allChartTeeth(): string[] {
  return ODONTO_QUADRANTS.flatMap((q) => [...q.primary, ...q.permanent]);
}

/** Colores por estatus/tratamiento en el odontograma (leyenda clínica). */
export const ODONTO_TREATMENT_OPTIONS = [
  { value: "realizado", label: "Tratamiento realizado", short: "OK", color: "#22C55E" },
  { value: "resina", label: "Resina / curación", short: "R", color: "#3B82F6" },
  { value: "sellador", label: "Sellador", short: "S", color: "#06B6D4" },
  { value: "extraccion", label: "Extracción", short: "X", color: "#EF4444" },
  { value: "pulpotomia", label: "Pulpotomía", short: "P", color: "#A855F7" },
  { value: "corona", label: "Corona", short: "CR", color: "#F59E0B" },
  { value: "conducto", label: "Tratamiento de conductos", short: "TC", color: "#8B5CF6" },
  { value: "caries", label: "Caries / por tratar", short: "C", color: "#F97316" },
  { value: "ausente", label: "Ausente", short: "A", color: "#6B7280" },
  { value: "observacion", label: "En observación", short: "OBS", color: "#EAB308" },
] as const;

export type OdontoTreatmentCode = (typeof ODONTO_TREATMENT_OPTIONS)[number]["value"] | "otro";

export const ODONTO_CUSTOM_COLOR = "#64748B";

type ResolvedToothTreatment =
  | { kind: "code"; code: OdontoTreatmentCode; text: string; color: string }
  | { kind: "custom"; text: string; color: string }
  | { kind: "legacy"; text: string; color: string };

const optionByValue = new Map<string, (typeof ODONTO_TREATMENT_OPTIONS)[number]>(
  ODONTO_TREATMENT_OPTIONS.map((opt) => [opt.value, opt]),
);

function optionForCode(code: string) {
  return optionByValue.get(code);
}

/** Guarda estatus + texto libre: `resina`, `resina:detalle` o `otro:texto`. */
export function toothTreatmentStorageValue(code: OdontoTreatmentCode | string, text = ""): string {
  const trimmed = text.trim();
  if (code === "otro" || !optionForCode(code)) {
    return trimmed ? `otro:${trimmed}` : "";
  }
  if (trimmed) return `${code}:${trimmed}`;
  return code;
}

export function resolveToothTreatment(value?: string | null): ResolvedToothTreatment | null {
  const raw = value?.trim();
  if (!raw) return null;

  const colon = raw.indexOf(":");
  if (colon > 0) {
    const code = raw.slice(0, colon);
    const text = raw.slice(colon + 1).trim();
    if (code === "otro") {
      if (!text) return null;
      return { kind: "custom", text, color: ODONTO_CUSTOM_COLOR };
    }
    const opt = optionForCode(code);
    if (opt) {
      return {
        kind: "code",
        code: opt.value,
        text: text || opt.label,
        color: opt.color,
      };
    }
  }

  const opt = optionForCode(raw);
  if (opt) {
    return { kind: "code", code: opt.value, text: opt.label, color: opt.color };
  }

  return { kind: "legacy", text: raw, color: ODONTO_CUSTOM_COLOR };
}

export function getToothTreatmentStatusCode(value?: string | null): OdontoTreatmentCode | "none" {
  const resolved = resolveToothTreatment(value);
  if (!resolved) return "none";
  if (resolved.kind === "code") return resolved.code;
  return "otro";
}

export function getToothTreatmentText(value?: string | null): string {
  const resolved = resolveToothTreatment(value);
  if (!resolved) return "";
  if (resolved.kind === "code") {
    const opt = optionForCode(resolved.code);
    if (opt && resolved.text === opt.label) return "";
    return resolved.text;
  }
  return resolved.text;
}

export function getToothTreatmentSelectValue(value?: string | null): string {
  return getToothTreatmentStatusCode(value);
}

export function getToothTreatmentColor(value?: string | null): string | undefined {
  return resolveToothTreatment(value)?.color;
}

export function getToothTreatmentLabel(value?: string | null): string {
  return resolveToothTreatment(value)?.text ?? "";
}

export function getToothTreatmentShort(value?: string | null): string {
  const resolved = resolveToothTreatment(value);
  if (!resolved) return "";
  if (resolved.kind === "code") {
    const opt = optionForCode(resolved.code);
    return opt?.short ?? resolved.text.slice(0, 3).toUpperCase();
  }
  return resolved.text.slice(0, 3).toUpperCase();
}
