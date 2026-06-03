import type { ClinicalSafetyReport } from "@/lib/clinicalSafety";
import { doseSuggestionForMedication } from "@/lib/clinicalSafety";

export function PediatricDoseHint({
  medication,
  report,
}: {
  medication: string;
  report: ClinicalSafetyReport | undefined;
}) {
  const suggestion = doseSuggestionForMedication(report, medication);
  if (!suggestion?.suggestedDose) return null;

  return (
    <p className="text-xs text-sky-800 dark:text-sky-200 bg-sky-500/10 border border-sky-500/30 rounded-lg px-2 py-1.5 mt-1 sm:col-span-12">
      Sugerido: {suggestion.suggestedDose}
    </p>
  );
}
