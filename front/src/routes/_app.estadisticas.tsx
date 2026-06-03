import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  Brain,
  CalendarCheck,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import type { AnalyticsPeriod } from "@/lib/analytics";
import { formatDelta, formatPct } from "@/lib/analytics";
import { StatCard } from "@/components/clinical/StatCard";
import { AnalyticsPeriodSelect } from "@/components/analytics/AnalyticsPeriodSelect";
import { ClinicalInsightsPanel } from "@/components/analytics/ClinicalInsightsPanel";
import {
  AgeDistributionChart,
  ConsultationsTrendChart,
  RankedBarChart,
} from "@/components/analytics/AnalyticsCharts";
import { DistributionPieChart } from "@/components/analytics/DistributionPieChart";

export const Route = createFileRoute("/_app/estadisticas")({
  head: () => ({ meta: [{ title: "Estadísticas — MediFlow" }] }),
  component: EstadisticasPage,
});

function EstadisticasPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<AnalyticsPeriod>("90d");

  const analyticsQ = useQuery({
    queryKey: tenantKey(["dashboard-analytics", period], user?.brandingId),
    queryFn: () => api.dashboard.analytics(period),
    enabled: !!user?.brandingId,
  });

  const data = analyticsQ.data;
  const kpis = data?.kpis;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold">Estadísticas clínicas</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Tendencias y patrones de tu consultorio para apoyar la toma de decisiones.
            </p>
          </div>
        </div>
        <AnalyticsPeriodSelect value={period} onChange={setPeriod} />
      </div>

      {analyticsQ.isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {analyticsQ.isError && (
        <div className="bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 p-4 text-sm">
          No se pudieron cargar las estadísticas. Intenta de nuevo más tarde.
        </div>
      )}

      {data && kpis && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Activity}
              label="Consultas"
              value={kpis.consultations}
              hint={formatDelta(kpis.consultationsDelta) || "En el periodo seleccionado"}
              accent="primary"
            />
            <StatCard
              icon={CalendarCheck}
              label="Tasa de asistencia"
              value={formatPct(kpis.attendanceRate)}
              hint={formatDelta(kpis.attendanceRateDelta, " pts") || "Citas completadas / no canceladas"}
              accent="accent"
            />
            <StatCard
              icon={Users}
              label="Sin control (+6 meses)"
              value={kpis.recallGapPatients}
              hint={`${kpis.recallGapPct}% de ${kpis.totalPatients} pacientes`}
              accent="warning"
            />
            <StatCard
              icon={Brain}
              label="Frankl cooperativo"
              value={formatPct(kpis.franklCooperativePct)}
              hint={`${kpis.franklImproving} en mejora · ${kpis.franklChallenging} desafiantes`}
              accent="success"
            />
          </div>

          <ClinicalInsightsPanel insights={data.insights} />

          <ConsultationsTrendChart data={data.series.consultationsByMonth} />

          <div className="grid lg:grid-cols-2 gap-6">
            <RankedBarChart
              title="Medicamentos más prescritos"
              data={data.rankings.medications}
              emptyMessage="No hay recetas en el periodo seleccionado."
            />
            <RankedBarChart
              title="Motivos de cita frecuentes"
              data={data.rankings.appointmentReasons}
              emptyMessage="No hay citas en el periodo seleccionado."
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <RankedBarChart
              title="Procedimientos en odontograma"
              data={data.rankings.dentalProcedures}
              emptyMessage="Aún no hay tratamientos registrados en odontogramas."
            />
            <AgeDistributionChart data={data.distributions.ageGroups} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <DistributionPieChart
              title="Estado de citas"
              data={data.distributions.appointmentStatus}
              emptyMessage="No hay citas en el periodo seleccionado."
            />
            <DistributionPieChart
              title="Distribución Frankl"
              data={data.distributions.frankl}
              emptyMessage="No hay lecturas Frankl en el periodo seleccionado."
            />
          </div>
        </>
      )}
    </div>
  );
}
