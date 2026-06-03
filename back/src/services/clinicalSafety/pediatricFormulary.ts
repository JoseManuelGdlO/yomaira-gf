import { medicationMatchesKeyword } from './allergenMap';

export type FormularyEntry = {
  matchKeywords: string[];
  label: string;
  mgPerKg: number;
  maxMgPerDose: number;
  frequency: string;
  /** If set, daily dose divided by this many doses (e.g. amoxicillin TID) */
  dailyDoses?: number;
  note?: string;
};

export const PEDIATRIC_FORMULARY: FormularyEntry[] = [
  {
    matchKeywords: ['amoxicilina', 'amoxicillin'],
    label: 'Amoxicilina',
    mgPerKg: 50,
    maxMgPerDose: 1000,
    frequency: 'c/8h',
    dailyDoses: 3,
    note: '50 mg/kg/día dividido en 3 dosis',
  },
  {
    matchKeywords: ['ibuprofeno', 'ibuprofen'],
    label: 'Ibuprofeno',
    mgPerKg: 10,
    maxMgPerDose: 400,
    frequency: 'c/8h',
  },
  {
    matchKeywords: ['paracetamol', 'acetaminofen', 'acetaminophen'],
    label: 'Paracetamol',
    mgPerKg: 15,
    maxMgPerDose: 500,
    frequency: 'c/6h',
  },
  {
    matchKeywords: ['clindamicina', 'clindamycin'],
    label: 'Clindamicina',
    mgPerKg: 10,
    maxMgPerDose: 600,
    frequency: 'c/8h',
    note: 'Alternativa si alergia a penicilinas',
  },
  {
    matchKeywords: ['naproxeno', 'naproxen'],
    label: 'Naproxeno',
    mgPerKg: 5,
    maxMgPerDose: 250,
    frequency: 'c/12h',
  },
];

export function matchFormularyEntry(medication: string): FormularyEntry | null {
  if (!medication.trim()) return null;
  for (const entry of PEDIATRIC_FORMULARY) {
    if (entry.matchKeywords.some((kw) => medicationMatchesKeyword(medication, kw))) {
      return entry;
    }
  }
  return null;
}

export function calculateSuggestedDose(
  weightKg: number,
  entry: FormularyEntry,
): { mg: number; text: string } {
  let mg = entry.mgPerKg * weightKg;
  if (entry.dailyDoses) {
    mg = mg / entry.dailyDoses;
  }
  mg = Math.min(mg, entry.maxMgPerDose);
  mg = Math.round(mg * 10) / 10;
  const detail = entry.dailyDoses
    ? `${entry.mgPerKg} mg/kg/día ÷ ${entry.dailyDoses}`
    : `${entry.mgPerKg} mg/kg`;
  return {
    mg,
    text: `~${mg} mg (${detail} × ${weightKg} kg), ${entry.frequency}${entry.note ? `. ${entry.note}` : ''}`,
  };
}
