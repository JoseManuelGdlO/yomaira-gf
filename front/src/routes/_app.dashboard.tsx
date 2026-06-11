import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Calendar, Pill, Activity, Plus, ArrowUpRight, Sparkles, Brain, BarChart3, Lightbulb, Package, AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { tenantKey } from "@/lib/tenantQuery";
import { StatCard } from "@/components/clinical/StatCard";
import { PatientAvatar } from "@/components/clinical/PatientAvatar";
import { StatusBadge } from "@/components/clinical/StatusBadge";
import { FranklBadge } from "@/components/clinical/FranklBadge";
import { fmtShort, fmtMonthShort, fmtDay, fmtWeekdayLong, fmtMonthLong, todayISO } from "@/lib/format";
import { QuickPrescriptionDialog } from "@/components/prescription/QuickPrescriptionDialog";
import { OnboardingDialog } from "@/components/app/OnboardingDialog";
import { useEffect, useMemo, useState } from "react";
import { useFranklSummariesMap } from "@/lib/useFranklSummaries";
import { shouldShowFranklBadge } from "@/lib/frankl";
import { ConsultationsTrendChart, RankedBarChart } from "@/components/analytics/AnalyticsCharts";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MediFlow" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { branding } = useBranding();
  const { user, hasPermission } = useAuth();
  const { patients, appointments, prescriptions, consultations } = useStore();
  const [rxOpen, setRxOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem("onboarding-seen")) {
        const t = setTimeout(() => setTourOpen(true), 400);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);
  const today = todayISO();
  const todayAppts = appointments.filter((a) => a.date === today);
  const upcoming = appointments.filter((a) => a.date >= today && a.status !== "cancelada").sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 5);
  const recentPatients = [...patients].sort((a, b) => b.lastVisit.localeCompare(a.lastVisit)).slice(0, 5);

  const franklTodayQ = useQuery({
    queryKey: tenantKey(["dashboard-frankl", "today"], user?.brandingId),
    queryFn: () => api.dashboard.frankl("today"),
    enabled: !!user?.brandingId,
  });

  const franklMap = useFranklSummariesMap(useMemo(() => upcoming.map((a) => a.patientId), [upcoming]));

  const showAnalytics = hasPermission("consultations.read");
  const showInventory = hasPermission("inventory.read") || hasPermission("inventory.write");

  const inventoryQ = useQuery({
    queryKey: [...tenantKey(["inventory"], user?.brandingId), "all"],
    queryFn: () => api.inventory.list(),
    enabled: !!user?.brandingId && showInventory,
  });

  const lowStockItems = useMemo(
    () =>
      (inventoryQ.data ?? []).filter(
        (i) => i.active && (i.isLowStock || i.quantity <= i.minQuantity),
      ),
    [inventoryQ.data],
  );

  const analyticsQ = useQuery({
    queryKey: tenantKey(["dashboard-analytics", "90d"], user?.brandingId),
    queryFn: () => api.dashboard.analytics("90d"),
    enabled: !!user?.brandingId && showAnalytics,
  });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-3xl p-8 lg:p-10 relative overflow-hidden" style={{ background: `linear-gradient(135deg, oklch(${branding.primary} / 0.92), oklch(${branding.accent} / 0.85))`, color: "white" }}>
        <div className="relative z-10 max-w-2xl">
          <div className="text-sm opacity-90 mb-2" suppressHydrationWarning>
            {(() => { const d = new Date(); return `${fmtWeekdayLong(d)}, ${d.getDate()} de ${fmtMonthLong(d)}`; })()}
          </div>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold leading-tight">Hola, {branding.doctorName.split(" ")[1] ?? "Doctora"} 👋</h1>
          <p className="mt-2 opacity-90">Tienes <strong>{todayAppts.length}</strong> {todayAppts.length === 1 ? "consulta" : "consultas"} hoy. Tu día está organizado.</p>
          <div className="flex gap-3 mt-6 flex-wrap">
            <button onClick={() => setRxOpen(true)} className="inline-flex items-center gap-2 bg-white text-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/90">
              <Plus className="h-4 w-4" /> Nueva receta
            </button>
            <Link to="/pacientes" className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/30 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/25">
              Ver pacientes <ArrowUpRight className="h-4 w-4" />
            </Link>
            <button onClick={() => setTourOpen(true)} className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/30 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/25">
              <Sparkles className="h-4 w-4" /> Ver tutorial
            </button>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 text-[14rem] opacity-15 select-none">{branding.logoEmoji}</div>
      </div>

      {showInventory && lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-semibold text-amber-900 dark:text-amber-100">
                Alerta de inventario — {lowStockItems.length}{" "}
                {lowStockItems.length === 1 ? "insumo con stock bajo" : "insumos con stock bajo"}
              </h2>
              <ul className="mt-2 space-y-1 text-sm text-amber-800/90 dark:text-amber-200/90">
                {lowStockItems.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <strong>{item.name}</strong>: {item.quantity} {item.unit} (mín. {item.minQuantity})
                  </li>
                ))}
                {lowStockItems.length > 5 && (
                  <li className="text-amber-700/80 dark:text-amber-300/80">
                    y {lowStockItems.length - 5} más…
                  </li>
                )}
              </ul>
              <Link to="/inventario" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-amber-900 dark:text-amber-100 hover:underline">
                <Package className="h-4 w-4" /> Ir a inventario
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className={`grid grid-cols-2 gap-4 ${showInventory ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        <StatCard icon={Users} label="Pacientes activos" value={patients.length} hint="+2 esta semana" accent="primary" />
        <StatCard icon={Calendar} label="Citas hoy" value={todayAppts.length} hint={`${appointments.filter(a => a.status === "confirmada").length} confirmadas`} accent="accent" />
        <StatCard icon={Pill} label="Recetas emitidas" value={prescriptions.length} hint="Este mes" accent="success" />
        <StatCard icon={Activity} label="Consultas" value={consultations.length} hint="Histórico" accent="warning" />
        {showInventory && (
          <StatCard
            icon={Package}
            label="Stock bajo"
            value={lowStockItems.length}
            hint={lowStockItems.length > 0 ? "Reabastecer pronto" : "Inventario OK"}
            accent="warning"
          />
        )}
      </div>

      {showAnalytics && analyticsQ.data && (
        <div className="bg-card rounded-2xl border p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Insights clínicos</h2>
              <span className="text-xs text-muted-foreground">Últimos 90 días</span>
            </div>
            <Link to="/estadisticas" className="text-sm text-primary font-medium hover:underline">
              Ver estadísticas completas
            </Link>
          </div>

          {analyticsQ.data.insights.length > 0 && (
            <ul className="space-y-2">
              {analyticsQ.data.insights.slice(0, 3).map((text, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="grid lg:grid-cols-2 gap-4">
            <ConsultationsTrendChart data={analyticsQ.data.series.consultationsByMonth} compact />
            <RankedBarChart
              title="Top medicamentos"
              data={analyticsQ.data.rankings.medications.slice(0, 5)}
              emptyMessage="Sin recetas en los últimos 90 días."
              compact
            />
          </div>
        </div>
      )}

      {(franklTodayQ.data?.todayAppointments?.length ?? 0) > 0 && (
        <div className="bg-card rounded-2xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Comportamiento hoy</h2>
            </div>
            <Link to="/comportamiento" className="text-sm text-primary font-medium hover:underline">Ver todos</Link>
          </div>
          <div className="divide-y">
            {franklTodayQ.data!.todayAppointments.map((item) => (
              <Link
                key={item.appointmentId}
                to="/pacientes/$id"
                params={{ id: item.patientId }}
                className="flex items-center gap-4 py-3 hover:bg-surface -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="text-center w-14 shrink-0">
                  <div className="text-xs text-primary font-medium">{item.time}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-2 flex-wrap">
                    {item.patientName}
                    {item.franklSummary.latestFrankl && (
                      <FranklBadge frankl={item.franklSummary.latestFrankl} summary={item.franklSummary} />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{item.reason}</div>
                  {item.franklSummary.primaryAlert && (
                    <div className="text-xs text-amber-700 dark:text-amber-300 mt-1 line-clamp-2">
                      {item.franklSummary.primaryAlert.message}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Two col */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl border p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Próximas consultas</h2>
            <Link to="/agenda" className="text-sm text-primary font-medium hover:underline">Ver agenda</Link>
          </div>
          <div className="divide-y">
            {upcoming.map((a) => {
              const p = patients.find((x) => x.id === a.patientId);
              if (!p) return null;
              const franklSummary = franklMap.get(a.patientId);
              return (
                <Link key={a.id} to="/pacientes/$id" params={{ id: p.id }} className="flex items-center gap-4 py-3 hover:bg-surface -mx-2 px-2 rounded-lg transition-colors">
                  <div className="text-center w-14 shrink-0">
                    <div className="text-xs text-muted-foreground uppercase">{fmtMonthShort(a.date)}</div>
                    <div className="font-display text-xl font-semibold leading-none">{fmtDay(a.date)}</div>
                    <div className="text-xs text-primary font-medium mt-0.5">{a.time}</div>
                  </div>
                  <PatientAvatar patient={p} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate flex items-center gap-2 flex-wrap">
                      {p.name}
                      {shouldShowFranklBadge(franklSummary) && franklSummary?.latestFrankl && (
                        <FranklBadge frankl={franklSummary.latestFrankl} summary={franklSummary} />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{a.reason}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-2xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Pacientes recientes</h2>
            <Link to="/pacientes" className="text-sm text-primary font-medium hover:underline">Todos</Link>
          </div>
          <div className="space-y-3">
            {recentPatients.map((p) => (
              <Link key={p.id} to="/pacientes/$id" params={{ id: p.id }} className="flex items-center gap-3 hover:bg-surface -mx-2 px-2 py-2 rounded-lg transition-colors">
                <PatientAvatar patient={p} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.age} años · {fmtShort(p.lastVisit)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <QuickPrescriptionDialog patientId={null} open={rxOpen} onOpenChange={setRxOpen} />
      <OnboardingDialog open={tourOpen} onOpenChange={setTourOpen} />
    </div>
  );
}
