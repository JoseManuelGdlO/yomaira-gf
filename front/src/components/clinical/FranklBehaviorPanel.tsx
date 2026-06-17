import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { AlertTriangle, TrendingDown, TrendingUp, Minus, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { fmtShort } from "@/lib/format";
import {
  alertClass,
  displayFranklScale,
  franklToScore,
  isRecordableFranklScale,
  trendClass,
  trendLabel,
  type FranklAlert,
} from "@/lib/frankl";
import { FranklBadge } from "./FranklBadge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CHART_COUNT_CONFIG } from "@/lib/chartColors";

const chartConfig = {
  score: { label: "Frankl", color: CHART_COUNT_CONFIG.count.color },
};

function AlertItem({ alert }: { alert: FranklAlert }) {
  const Icon =
    alert.severity === "success" ? TrendingUp : alert.type === "sedation" ? AlertTriangle : Activity;
  return (
    <div className={cnAlert(alert.severity)}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <p className="text-sm leading-snug">{alert.message}</p>
    </div>
  );
}

function cnAlert(severity: FranklAlert["severity"]) {
  return `flex gap-2 rounded-xl border p-3 ${alertClass(severity)}`;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "improving") return <TrendingUp className={cnIcon(trend)} />;
  if (trend === "declining") return <TrendingDown className={cnIcon(trend)} />;
  return <Minus className={cnIcon(trend)} />;
}

function cnIcon(trend: string) {
  return `h-5 w-5 ${trendClass(trend as "improving" | "stable" | "declining" | "insufficient")}`;
}

export function FranklBehaviorPanel({ patientId }: { patientId: string }) {
  const { user } = useAuth();
  const brandingId = user?.brandingId;

  const readingsQ = useQuery({
    queryKey: tenantKey(["frankl-readings", patientId], brandingId),
    queryFn: () => api.frankl.list(patientId),
    enabled: !!patientId,
  });

  const summaryQ = useQuery({
    queryKey: tenantKey(["frankl-summary", patientId], brandingId),
    queryFn: () => api.frankl.summary(patientId),
    enabled: !!patientId,
  });

  const readings = readingsQ.data ?? [];
  const summary = summaryQ.data;
  const chartFrankl = summary?.chartFrankl ?? "na";
  const chartData = readings.map((r) => ({
    date: r.recordedOn,
    label: fmtShort(r.recordedOn),
    score: franklToScore(r.frankl),
    frankl: r.frankl,
  }));

  if (readingsQ.isLoading || summaryQ.isLoading) {
    return (
      <section className="bg-card rounded-2xl border p-6">
        <div className="h-40 animate-pulse bg-surface rounded-xl" />
      </section>
    );
  }

  if (readings.length === 0 && !isRecordableFranklScale(chartFrankl)) {
    return (
      <section className="bg-card rounded-2xl border p-6">
        <h3 className="font-display text-lg font-semibold">Comportamiento (Frankl)</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Aún no hay lecturas registradas. Captura la escala Frankl en el odontograma o al completar una cita.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-card rounded-2xl border p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-display text-lg font-semibold">Comportamiento (Frankl)</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Evolución del comportamiento del paciente en consulta.
          </p>
        </div>
        {isRecordableFranklScale(chartFrankl) && (
          <FranklBadge frankl={chartFrankl} summary={summary} />
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          label="Frankl actual"
          value={displayFranklScale(chartFrankl)}
          hint={
            isRecordableFranklScale(chartFrankl) && summary?.latestRecordedOn
              ? fmtShort(summary.latestRecordedOn)
              : undefined
          }
        />
        <StatCard
          label="Tendencia"
          value={
            <span className="inline-flex items-center gap-2">
              <TrendIcon trend={summary?.trend ?? "insufficient"} />
              {trendLabel(summary?.trend ?? "insufficient")}
            </span>
          }
        />
        <StatCard label="Visitas registradas" value={String(summary?.readingCount ?? 0)} />
      </div>

      {chartData.length >= 2 && (
        <ChartContainer config={chartConfig} className="aspect-[2/1] max-h-[220px] w-full">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              domain={[1, 4]}
              ticks={[1, 2, 3, 4]}
              tickFormatter={(v) => ["", "I", "II", "III", "IV"][v] ?? ""}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => (
                    <span className="font-medium">
                      Frankl {(item.payload as { frankl: string }).frankl} ({value}/4)
                    </span>
                  )}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--color-score)"
              strokeWidth={2}
              dot={{ r: 4, fill: "var(--color-score)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      )}

      {summary && summary.alerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Observaciones clínicas</h4>
          {summary.alerts.map((alert, i) => (
            <AlertItem key={`${alert.type}-${i}`} alert={alert} />
          ))}
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium mb-2">Historial</h4>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-surface/50 text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Frankl</th>
                <th className="px-3 py-2 font-medium hidden sm:table-cell">Notas</th>
              </tr>
            </thead>
            <tbody>
              {[...readings].reverse().map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{fmtShort(r.recordedOn)}</td>
                  <td className="px-3 py-2">
                    <FranklBadge frankl={r.frankl} showTooltip={false} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">
                    {r.consultationId ? "Visita registrada" : r.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-surface/30 p-4">
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
      <div className="font-display text-xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}
