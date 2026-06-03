import type { Patient } from '../../models/Patient';
import { findAllergyConflicts } from './allergenMap';
import { calculateSuggestedDose, matchFormularyEntry } from './pediatricFormulary';
import { latexProcedureAlert, systemicAlertsFromAnswers, type SystemicContext } from './systemicRules';

export type ClinicalSafetyAlertType =
  | 'allergy_conflict'
  | 'systemic_precaution'
  | 'dose_suggestion'
  | 'missing_weight';

export type ClinicalSafetySeverity = 'critical' | 'warning' | 'info';

export type ClinicalSafetyAlert = {
  type: ClinicalSafetyAlertType;
  severity: ClinicalSafetySeverity;
  message: string;
  medication?: string;
  suggestedDose?: string;
};

export type ClinicalSafetyReport = {
  alerts: ClinicalSafetyAlert[];
  hasCritical: boolean;
};

export type PrescriptionItemInput = {
  medication: string;
  dose?: string;
  frequency?: string;
  duration?: string;
};

export type EvaluateClinicalSafetyInput = {
  patient: Pick<Patient, 'allergies' | 'weightKg' | 'age'>;
  clinicalAnswers: Record<string, string | string[] | null>;
  prescriptionItems?: PrescriptionItemInput[];
  context: SystemicContext;
};

function parseWeightKg(weightKg: number | null | undefined): number | null {
  if (weightKg == null || weightKg === undefined) return null;
  const n = Number(weightKg);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function evaluateClinicalSafety(input: EvaluateClinicalSafetyInput): ClinicalSafetyReport {
  const alerts: ClinicalSafetyAlert[] = [];
  const { patient, clinicalAnswers, prescriptionItems = [], context } = input;
  const weight = parseWeightKg(patient.weightKg);

  for (const systemic of systemicAlertsFromAnswers(clinicalAnswers, context)) {
    alerts.push({
      type: 'systemic_precaution',
      severity: 'warning',
      message: systemic.message,
    });
  }

  if (context === 'procedure') {
    const latex = latexProcedureAlert(patient.allergies);
    if (latex) {
      alerts.push({
        type: 'systemic_precaution',
        severity: 'warning',
        message: latex.message,
      });
    }
  }

  const hasRxItems = prescriptionItems.some((it) => it.medication.trim());
  const needsWeight =
    context === 'prescription' &&
    hasRxItems &&
    prescriptionItems.some((it) => matchFormularyEntry(it.medication));

  if (needsWeight && weight == null) {
    alerts.push({
      type: 'missing_weight',
      severity: 'warning',
      message:
        'Registra el peso del paciente (kg) para calcular la dosis pediátrica sugerida.',
    });
  }

  for (const item of prescriptionItems) {
    const med = item.medication.trim();
    if (!med) continue;

    const conflicts = findAllergyConflicts(patient.allergies, med);
    for (const conflict of conflicts) {
      alerts.push({
        type: 'allergy_conflict',
        severity: 'critical',
        message: `Posible conflicto: alergia a "${conflict.allergy}" vs medicamento con "${conflict.matchedKeyword}" (${med}). Verificar antes de prescribir.`,
        medication: med,
      });
    }

    if (context === 'prescription' && weight != null) {
      const entry = matchFormularyEntry(med);
      if (entry) {
        const suggested = calculateSuggestedDose(weight, entry);
        alerts.push({
          type: 'dose_suggestion',
          severity: 'info',
          message: `${entry.label}: dosis sugerida ${suggested.text}.`,
          medication: med,
          suggestedDose: suggested.text,
        });
      }
    }
  }

  const deduped = dedupeAlerts(alerts);
  return {
    alerts: deduped,
    hasCritical: deduped.some((a) => a.severity === 'critical'),
  };
}

function dedupeAlerts(alerts: ClinicalSafetyAlert[]): ClinicalSafetyAlert[] {
  const seen = new Set<string>();
  return alerts.filter((a) => {
    const key = `${a.type}|${a.message}|${a.medication ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
