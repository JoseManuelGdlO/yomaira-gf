export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

export type AllergenRule = {
  allergyTerms: string[];
  drugKeywords: string[];
};

/** Maps allergy terms to medication name substrings to flag. */
export const ALLERGEN_RULES: AllergenRule[] = [
  {
    allergyTerms: ['penicilina', 'penicillin', 'penicilinas', 'amoxicilina'],
    drugKeywords: ['amoxicilina', 'amoxicillin', 'ampicilina', 'ampicillin', 'penicilina', 'penicillin', 'amoxiclav', 'clavulanico'],
  },
  {
    allergyTerms: ['ibuprofeno', 'aine', 'aines', 'a.i.n.e', 'antiinflamatorio'],
    drugKeywords: ['ibuprofeno', 'ibuprofen', 'naproxeno', 'naproxen', 'ketorolaco', 'diclofenaco', 'meloxicam'],
  },
  {
    allergyTerms: ['aspirina', 'acido acetilsalicilico', 'aas'],
    drugKeywords: ['aspirina', 'aspirin', 'acetilsalicilico', 'aas'],
  },
  {
    allergyTerms: ['paracetamol', 'acetaminofen'],
    drugKeywords: ['paracetamol', 'acetaminofen', 'acetaminophen', 'tylenol'],
  },
  {
    allergyTerms: ['clindamicina'],
    drugKeywords: ['clindamicina', 'clindamycin'],
  },
  {
    allergyTerms: ['latex', 'latex'],
    drugKeywords: [],
  },
  {
    allergyTerms: ['sulfas', 'sulfa', 'sulfamidas', 'sulfametoxazol'],
    drugKeywords: ['sulfametoxazol', 'trimethoprim', 'trimetoprima', 'bactrim'],
  },
];

export function medicationMatchesKeyword(medication: string, keyword: string): boolean {
  return normalizeText(medication).includes(normalizeText(keyword));
}

export function allergyMatchesTerm(allergy: string, term: string): boolean {
  const a = normalizeText(allergy);
  const t = normalizeText(term);
  return a.includes(t) || t.includes(a);
}

export function findAllergyConflicts(
  allergies: string[],
  medication: string,
): { allergy: string; matchedKeyword: string }[] {
  if (!medication.trim() || allergies.length === 0) return [];

  const conflicts: { allergy: string; matchedKeyword: string }[] = [];

  for (const allergy of allergies) {
    for (const rule of ALLERGEN_RULES) {
      const allergyHit = rule.allergyTerms.some((term) => allergyMatchesTerm(allergy, term));
      if (!allergyHit) continue;

      for (const keyword of rule.drugKeywords) {
        if (medicationMatchesKeyword(medication, keyword)) {
          conflicts.push({ allergy, matchedKeyword: keyword });
          break;
        }
      }
    }
  }

  return conflicts;
}
