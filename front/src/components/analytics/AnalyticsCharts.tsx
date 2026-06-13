import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { RankedItem } from "@/lib/analytics";
import { CHART_COUNT_CONFIG } from "@/lib/chartColors";

const chartConfig = CHART_COUNT_CONFIG;

function normalizeLabel(label: string) {
  return label.replace(/\s+/g, " ").trim();
}

function truncateLabel(label: string, max: number) {
  const text = normalizeLabel(label);
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function rankedChartHeight(itemCount: number, compact: boolean) {
  const rowHeight = compact ? 44 : 48;
  const minHeight = compact ? 220 : 280;
  return Math.max(minHeight, itemCount * rowHeight + 24);
}

function RankedYAxisTick({
  x = 0,
  y = 0,
  payload,
  maxChars,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  maxChars: number;
}) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="hsl(var(--muted-foreground))"
        fontSize={11}
      >
        {truncateLabel(String(payload?.value ?? ""), maxChars)}
      </text>
    </g>
  );
}

export function ConsultationsTrendChart({
  data,
  compact = false,
}: {
  data: { label: string; count: number }[];
  compact?: boolean;
}) {
  if (data.every((d) => d.count === 0)) {
    return (
      <ChartShell title="Consultas por mes" compact={compact}>
        <p className="text-sm text-muted-foreground">Sin consultas registradas en los últimos 12 meses.</p>
      </ChartShell>
    );
  }

  return (
    <ChartShell title="Consultas por mes" subtitle="Últimos 12 meses" compact={compact}>
      <ChartContainer config={chartConfig} className={compact ? "h-[180px] w-full" : "h-[280px] w-full"}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartShell>
  );
}

export function RankedBarChart({
  title,
  data,
  emptyMessage,
  compact = false,
}: {
  title: string;
  data: RankedItem[];
  emptyMessage: string;
  compact?: boolean;
}) {
  if (data.length === 0) {
    return (
      <ChartShell title={title} compact={compact}>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </ChartShell>
    );
  }

  const chartData = data.map((d) => ({ name: normalizeLabel(d.label), count: d.count, pct: d.pct }));
  const chartHeight = rankedChartHeight(chartData.length, compact);
  const yAxisWidth = compact ? 128 : 156;
  const labelMaxChars = compact ? 20 : 28;

  return (
    <ChartShell title={title} compact={compact}>
      <ChartContainer
        config={chartConfig}
        className={`aspect-auto w-full ${compact ? "min-h-[220px]" : "min-h-[280px]"}`}
        style={{ height: chartHeight }}
      >
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
          barCategoryGap={compact ? "28%" : "22%"}
          barSize={compact ? 12 : 16}
        >
          <CartesianGrid horizontal={false} />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={yAxisWidth}
            interval={0}
            tick={<RankedYAxisTick maxChars={labelMaxChars} />}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { name?: string } | undefined;
                  return row?.name ?? "";
                }}
              />
            }
          />
          <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartShell>
  );
}

export function AgeDistributionChart({ data }: { data: RankedItem[] }) {
  return (
    <ChartShell title="Perfil de edad" subtitle="Cartera activa de pacientes">
      <ChartContainer config={chartConfig} className="h-[280px] w-full">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartShell>
  );
}

function ChartShell({
  title,
  subtitle,
  compact,
  children,
}: {
  title: string;
  subtitle?: string;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`bg-card rounded-2xl border ${compact ? "p-4" : "p-6"}`}>
      <div className={compact ? "mb-3" : "mb-4"}>
        <h3 className={`font-display font-semibold ${compact ? "text-base" : "text-lg"}`}>{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
