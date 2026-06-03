import { Lightbulb } from "lucide-react";

export function ClinicalInsightsPanel({ insights }: { insights: string[] }) {
  if (insights.length === 0) {
    return (
      <section className="bg-card rounded-2xl border p-6">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Insights clínicos
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Aún no hay suficientes datos para generar insights en este periodo.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-card rounded-2xl border p-6">
      <h2 className="font-display text-lg font-semibold flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-primary" />
        Insights clínicos
      </h2>
      <ul className="space-y-3">
        {insights.map((text, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
