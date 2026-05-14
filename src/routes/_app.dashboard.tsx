import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Calendar, Pill, Activity, Plus, ArrowUpRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { StatCard } from "@/components/clinical/StatCard";
import { PatientAvatar } from "@/components/clinical/PatientAvatar";
import { StatusBadge } from "@/components/clinical/StatusBadge";
import { fmtShort, fmtMonthShort, fmtDay, fmtWeekdayLong, fmtMonthLong, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MedFlow" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { branding } = useBranding();
  const { patients, appointments, prescriptions, consultations } = useStore();
  const today = todayISO();
  const todayAppts = appointments.filter((a) => a.date === today);
  const upcoming = appointments.filter((a) => a.date >= today && a.status !== "cancelada").sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 5);
  const recentPatients = [...patients].sort((a, b) => b.lastVisit.localeCompare(a.lastVisit)).slice(0, 5);

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
            <Link to="/recetas/nueva" className="inline-flex items-center gap-2 bg-white text-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/90">
              <Plus className="h-4 w-4" /> Nueva receta
            </Link>
            <Link to="/pacientes" className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/30 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/25">
              Ver pacientes <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 text-[14rem] opacity-15 select-none">{branding.logoEmoji}</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Pacientes activos" value={patients.length} hint="+2 esta semana" accent="primary" />
        <StatCard icon={Calendar} label="Citas hoy" value={todayAppts.length} hint={`${appointments.filter(a => a.status === "confirmada").length} confirmadas`} accent="accent" />
        <StatCard icon={Pill} label="Recetas emitidas" value={prescriptions.length} hint="Este mes" accent="success" />
        <StatCard icon={Activity} label="Consultas" value={consultations.length} hint="Histórico" accent="warning" />
      </div>

      {/* Two col */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl border p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Próximas consultas</h2>
            <Link to="/agenda" className="text-sm text-primary font-medium hover:underline">Ver agenda</Link>
          </div>
          <div className="divide-y">
            {upcoming.map((a) => {
              const p = patients.find((x) => x.id === a.patientId)!;
              return (
                <Link key={a.id} to="/pacientes/$id" params={{ id: p.id }} className="flex items-center gap-4 py-3 hover:bg-surface -mx-2 px-2 rounded-lg transition-colors">
                  <div className="text-center w-14 shrink-0">
                    <div className="text-xs text-muted-foreground uppercase">{fmtMonthShort(a.date)}</div>
                    <div className="font-display text-xl font-semibold leading-none">{fmtDay(a.date)}</div>
                    <div className="text-xs text-primary font-medium mt-0.5">{a.time}</div>
                  </div>
                  <PatientAvatar patient={p} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
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
    </div>
  );
}
