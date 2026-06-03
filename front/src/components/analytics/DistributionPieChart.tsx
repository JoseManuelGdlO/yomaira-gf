import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { RankedItem } from "@/lib/analytics";
import { CHART_PALETTE } from "@/lib/chartColors";

const COLORS = CHART_PALETTE;

const chartConfig = {
  count: { label: "Cantidad" },
};

export function DistributionPieChart({
  title,
  data,
  emptyMessage,
}: {
  title: string;
  data: RankedItem[];
  emptyMessage: string;
}) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <section className="bg-card rounded-2xl border p-6">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-4">{emptyMessage}</p>
      </section>
    );
  }

  const chartData = data.map((d) => ({ name: d.label, count: d.count }));

  return (
    <section className="bg-card rounded-2xl border p-6">
      <h3 className="font-display text-lg font-semibold mb-4">{title}</h3>
      <ChartContainer config={chartConfig} className="h-[280px] w-full mx-auto max-w-sm">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
          <Pie data={chartData} dataKey="count" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-2">
        {chartData.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span>{d.name}</span>
            <span className="text-muted-foreground">({d.count})</span>
          </div>
        ))}
      </div>
    </section>
  );
}
