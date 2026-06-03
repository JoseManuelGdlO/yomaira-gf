import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Brain, AlertTriangle, TrendingUp, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { StatCard } from "@/components/clinical/StatCard";
import { FranklBadge } from "@/components/clinical/FranklBadge";
import { fmtShort } from "@/lib/format";
import { trendClass, trendLabel, type FranklTrend } from "@/lib/frankl";

export const Route = createFileRoute("/_app/comportamiento")({
  head: () => ({ meta: [{ title: "Comportamiento — MediFlow" }] }),
  component: ComportamientoPage,
});

const TREND_FILTERS: Array<{ value: FranklTrend | "all"; label: string }> = [
  { value: "all", label: "Todas las tendencias" },
  { value: "improving", label: "En mejora" },
  { value: "stable", label: "Estable" },
  { value: "declining", label: "En declive" },
  { value: "insufficient", label: "Datos insuficientes" },
];

const FRANKL_FILTERS = ["all", "I", "II", "III", "IV"] as const;

function ComportamientoPage() {
  const { user } = useAuth();
  const [trendFilter, setTrendFilter] = useState<FranklTrend | "all">("all");
  const [franklFilter, setFranklFilter] = useState<(typeof FRANKL_FILTERS)[number]>("all");
  const [alertOnly, setAlertOnly] = useState(false);

  const franklQ = useQuery({
    queryKey: tenantKey(["dashboard-frankl", "all"], user?.brandingId),
    queryFn: () => api.dashboard.frankl("all"),
    enabled: !!user?.brandingId,
  });

  const filtered = useMemo(() => {
    let rows = franklQ.data?.patients ?? [];
    if (trendFilter !== "all") {
      rows = rows.filter((r) => r.trend === trendFilter);
    }
    if (franklFilter !== "all") {
      rows = rows.filter((r) => r.latestFrankl === franklFilter);
    }
    if (alertOnly) {
      rows = rows.filter((r) => r.alerts.some((a) => a.type === "sedation" || a.type === "extra_time"));
    }
    return rows;
  }, [franklQ.data?.patients, trendFilter, franklFilter, alertOnly]);

  const counts = franklQ.data?.counts;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold">Comportamiento (Frankl)</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Vista del consultorio: pacientes con comportamiento difícil o en seguimiento.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertTriangle}
          label="Alerta sedación"
          value={counts?.sedationAlert ?? "—"}
          hint="Frankl I–II persistente"
          accent="warning"
        />
        <StatCard
          icon={Users}
          label="Requieren atención"
          value={counts?.challengingLatest ?? "—"}
          hint="Comportamiento difícil o variable"
          accent="primary"
        />
        <StatCard
          icon={TrendingUp}
          label="En mejora"
          value={counts?.improving ?? "—"}
          hint="Tendencia positiva"
          accent="success"
        />
        <StatCard
          icon={Brain}
          label="Con historial"
          value={counts?.totalWithReadings ?? "—"}
          hint="Pacientes registrados"
          accent="accent"
        />
      </div>

      <div className="bg-card rounded-2xl border p-4 flex flex-wrap gap-3 items-center">
        <select
          value={trendFilter}
          onChange={(e) => setTrendFilter(e.target.value as FranklTrend | "all")}
          className="text-sm border rounded-lg px-3 py-2 bg-surface"
        >
          {TREND_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select
          value={franklFilter}
          onChange={(e) => setFranklFilter(e.target.value as (typeof FRANKL_FILTERS)[number])}
          className="text-sm border rounded-lg px-3 py-2 bg-surface"
        >
          <option value="all">Todos los Frankl</option>
          {FRANKL_FILTERS.filter((f) => f !== "all").map((f) => (
            <option key={f} value={f}>Frankl {f}</option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={alertOnly}
            onChange={(e) => setAlertOnly(e.target.checked)}
            className="rounded border"
          />
          Solo con alertas activas
        </label>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} pacientes</span>
      </div>

      <div className="bg-card rounded-2xl border overflow-hidden">
        {franklQ.isLoading ? (
          <div className="p-12 text-center text-muted-foreground text-sm">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No hay pacientes que coincidan con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-surface/50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Paciente</th>
                  <th className="px-4 py-3 font-medium">Frankl</th>
                  <th className="px-4 py-3 font-medium">Tendencia</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Última visita</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Alerta principal</th>
                  <th className="px-4 py-3 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.patientId} className="border-b last:border-0 hover:bg-surface/40">
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.patientName}</div>
                      <div className="text-xs text-muted-foreground">{row.age} años · {row.readingCount} lecturas</div>
                    </td>
                    <td className="px-4 py-3">
                      {row.latestFrankl ? (
                        <FranklBadge
                          frankl={row.latestFrankl}
                          summary={{
                            latestFrankl: row.latestFrankl,
                            latestRecordedOn: row.latestRecordedOn,
                            readingCount: row.readingCount,
                            trend: row.trend,
                            alerts: row.alerts,
                            primaryAlert: row.primaryAlert,
                          }}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={`px-4 py-3 font-medium ${trendClass(row.trend)}`}>
                      {trendLabel(row.trend)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {row.latestRecordedOn ? fmtShort(row.latestRecordedOn) : fmtShort(row.lastVisit)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell max-w-xs">
                      <span className="line-clamp-2">{row.primaryAlert?.message ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to="/pacientes/$id"
                        params={{ id: row.patientId }}
                        className="text-primary font-medium hover:underline"
                      >
                        Ver expediente
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
