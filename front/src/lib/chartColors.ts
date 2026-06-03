/** Chart fills must use CSS vars directly — tokens are oklch(), not hsl components. */
export const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export const CHART_PRIMARY = "var(--chart-1)";

export const CHART_COUNT_CONFIG = {
  count: { label: "Cantidad", color: CHART_PRIMARY },
} as const;
