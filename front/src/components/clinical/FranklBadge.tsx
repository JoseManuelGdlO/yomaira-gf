import { cn } from "@/lib/utils";
import type { FranklReadingScale, FranklSummary } from "@/lib/frankl";
import { franklBadgeClass } from "@/lib/frankl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function FranklBadge({
  frankl,
  summary,
  className,
  showTooltip = true,
}: {
  frankl: FranklReadingScale | null | undefined;
  summary?: FranklSummary | null;
  className?: string;
  showTooltip?: boolean;
}) {
  if (!frankl) return null;

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums",
        franklBadgeClass(frankl),
        className,
      )}
    >
      Frankl {frankl}
    </span>
  );

  if (!showTooltip || !summary?.primaryAlert) return badge;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {summary.primaryAlert.message}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
