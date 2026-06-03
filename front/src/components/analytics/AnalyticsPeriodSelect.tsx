import type { AnalyticsPeriod } from "@/lib/analytics";
import { ANALYTICS_PERIOD_OPTIONS } from "@/lib/analytics";

export function AnalyticsPeriodSelect({
  value,
  onChange,
}: {
  value: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ANALYTICS_PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            value === opt.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-surface text-muted-foreground hover:bg-surface/80"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
