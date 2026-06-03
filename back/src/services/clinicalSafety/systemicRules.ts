export type SystemicContext = 'prescription' | 'procedure';

type SystemicRule = {
  antecedent: string;
  message: string;
  contexts: SystemicContext[];
};

const SYSTEMIC_RULES: SystemicRule[] = [
  {
    antecedent: 'Cardiacos',
    message:
      'Antecedente cardíaco registrado. Precaución con vasoconstrictores en anestésicos locales; coordinar con cardiólogo si el procedimiento es invasivo.',
    contexts: ['prescription', 'procedure'],
  },
  {
    antecedent: 'Pulmonares',
    message:
      'Antecedente pulmonar registrado (posible asma). Evaluar riesgo respiratorio y considerar sedación con precaución.',
    contexts: ['prescription', 'procedure'],
  },
  {
    antecedent: 'Sanguíneos',
    message:
      'Antecedente sanguíneo registrado. Revisar coagulación antes de extracciones o procedimientos invasivos.',
    contexts: ['procedure'],
  },
  {
    antecedent: 'Renales',
    message:
      'Antecedente renal registrado. Ajustar dosis de medicamentos y revisar uso de AINEs.',
    contexts: ['prescription', 'procedure'],
  },
  {
    antecedent: 'Psicológicos / neurológicos',
    message:
      'Antecedente psicológico o neurológico registrado. Considerar manejo conductual y apoyo adicional en consulta.',
    contexts: ['procedure'],
  },
  {
    antecedent: 'Alérgicos',
    message:
      'Antecedente alérgico en historia clínica. Verificar alergias registradas antes de prescribir o aplicar materiales.',
    contexts: ['prescription', 'procedure'],
  },
];

export function systemicAlertsFromAnswers(
  answers: Record<string, string | string[] | null>,
  context: SystemicContext,
): { type: 'systemic_precaution'; message: string }[] {
  const alerts: { type: 'systemic_precaution'; message: string }[] = [];
  const antecedents = answers.antecedents;
  const selected = Array.isArray(antecedents) ? antecedents : [];

  for (const rule of SYSTEMIC_RULES) {
    if (!rule.contexts.includes(context)) continue;
    if (selected.includes(rule.antecedent)) {
      alerts.push({ type: 'systemic_precaution', message: rule.message });
    }
  }

  const currentTreatment = answers.current_treatment;
  if (
    typeof currentTreatment === 'string' &&
    currentTreatment.trim() &&
    (context === 'prescription' || context === 'procedure')
  ) {
    alerts.push({
      type: 'systemic_precaution',
      message:
        'Paciente en tratamiento médico activo. Revisar posibles interacciones antes de prescribir o proceder.',
    });
  }

  return alerts;
}

export function latexProcedureAlert(allergies: string[]): { type: 'systemic_precaution'; message: string } | null {
  const hasLatex = allergies.some((a) => {
    const n = a.toLowerCase();
    return n.includes('latex') || n.includes('látex') || n.includes('latex');
  });
  if (!hasLatex) return null;
  return {
    type: 'systemic_precaution',
    message:
      'Alergia a látex registrada. Usar guantes y material libre de látex durante el procedimiento.',
  };
}
