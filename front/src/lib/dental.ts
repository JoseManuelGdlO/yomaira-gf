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

/** Rojo para piezas ya tratadas. */
export const ODONTO_DONE_COLOR = "#EF4444";

const LEGACY_LABELS: Record<string, string> = {
  realizado: "Tratamiento realizado",
  resina: "Resina / curación",
  sellador: "Sellador",
  extraccion: "Extracción",
  pulpotomia: "Pulpotomía",
  corona: "Corona",
  conducto: "Tratamiento de conductos",
  caries: "Caries / por tratar",
  ausente: "Ausente",
  observacion: "En observación",
};

function legacyText(value: string): string {
  const colon = value.indexOf(":");
  if (colon > 0) {
    const code = value.slice(0, colon);
    const text = value.slice(colon + 1).trim();
    if (code === "otro") return text;
    if (text) return text;
    return LEGACY_LABELS[code] ?? text;
  }
  return LEGACY_LABELS[value] ?? value;
}

export function parseToothTreatment(value?: string | null): { done: boolean; text: string } {
  const raw = value?.trim();
  if (!raw) return { done: false, text: "" };
  if (raw === "done") return { done: true, text: "" };
  if (raw.startsWith("done:")) return { done: true, text: raw.slice(5) };
  if (raw === "plan") return { done: false, text: "" };
  if (raw.startsWith("plan:")) return { done: false, text: raw.slice(5) };
  return { done: true, text: legacyText(raw) };
}

export function formatToothTreatment(done: boolean, text: string): string {
  const trimmed = text.trim();
  if (!trimmed && !done) return "";
  if (done) {
    if (!trimmed) return "done";
    return `done:${trimmed}`;
  }
  return `plan:${trimmed}`;
}

export function isToothTreatmentDone(value?: string | null): boolean {
  return parseToothTreatment(value).done;
}

export function getToothTreatmentText(value?: string | null): string {
  return parseToothTreatment(value).text;
}

export function getToothTreatmentLabel(value?: string | null): string {
  const { done, text } = parseToothTreatment(value);
  if (!text && !done) return "";
  if (done && !text) return "Realizado";
  return text;
}

export function getToothTreatmentColor(value?: string | null): string | undefined {
  return isToothTreatmentDone(value) ? ODONTO_DONE_COLOR : undefined;
}
