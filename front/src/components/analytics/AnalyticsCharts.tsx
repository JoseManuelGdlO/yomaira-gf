import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { RankedItem } from "@/lib/analytics";
import { CHART_COUNT_CONFIG } from "@/lib/chartColors";

const chartConfig = CHART_COUNT_CONFIG;

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

  const chartData = data.map((d) => ({ name: d.label, count: d.count, pct: d.pct }));

  return (
    <ChartShell title={title} compact={compact}>
      <ChartContainer config={chartConfig} className={compact ? "h-[180px] w-full" : "h-[280px] w-full"}>
        <BarChart layout="vertical" data={chartData} margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={compact ? 90 : 120}
            tick={{ fontSize: 11 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
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
