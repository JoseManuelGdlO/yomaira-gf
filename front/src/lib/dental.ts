/** FDI tooth numbering as on the client's clinical sheet (pediatric practice). */
export const ODONTO_QUADRANTS = [
  {
    label: "Superior derecho",
    primary: ["55", "54", "53", "52", "51"],
    permanent: ["18", "17", "16", "15", "14", "13", "12", "11"],
  },
  {
    label: "Superior izquierdo",
    primary: ["61", "62", "63", "64", "65"],
    permanent: ["21", "22", "23", "24", "25", "26", "27", "28"],
  },
  {
    label: "Inferior izquierdo",
    primary: ["75", "74", "73", "72", "71"],
    permanent: ["38", "37", "36", "35", "34", "33", "32", "31"],
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
