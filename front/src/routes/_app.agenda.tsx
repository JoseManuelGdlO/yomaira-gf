import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { PatientAvatar } from "@/components/clinical/PatientAvatar";
import { StatusBadge } from "@/components/clinical/StatusBadge";
import { FranklBadge } from "@/components/clinical/FranklBadge";
import { ChevronLeft, ChevronRight, Plus, CheckCircle2 } from "lucide-react";
import { fmtMonthLong, fmtWeekdayShort, todayISO } from "@/lib/format";
import { NewAppointmentDialog } from "@/components/clinical/NewAppointmentDialog";
import { CompleteAppointmentDialog } from "@/components/clinical/CompleteAppointmentDialog";
import type { Appointment } from "@/mocks/data";
import { useFranklSummariesMap } from "@/lib/useFranklSummaries";
import { shouldShowFranklBadge } from "@/lib/frankl";
import {
  AGENDA_LEGEND_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  appointmentStatusCardClass,
  appointmentStatusLegendClass,
  appointmentStatusRowClass,
  appointmentStatusTimeClass,
} from "@/lib/appointmentStatus";

export const Route = createFileRoute("/_app/agenda")({
  head: () => ({ meta: [{ title: "Agenda — MediFlow" }] }),
  component: AgendaPage,
});

function AgendaPage() {
  const { hasPermission } = useAuth();
  const { appointments, patients, setAppointmentStatus } = useStore();
  const [cursor, setCursor] = useState<Date | null>(null);
  const [view, setView] = useState<"semana" | "dia">("semana");
  const [selected, setSelected] = useState<string>("");
  const [newOpen, setNewOpen] = useState(false);
  const [completeAppt, setCompleteAppt] = useState<Appointment | null>(null);
  const patientIds = useMemo(() => appointments.map((a) => a.patientId), [appointments]);
  const franklMap = useFranklSummariesMap(patientIds);
  useEffect(() => { setCursor(new Date()); setSelected(todayISO()); }, []);
  if (!cursor) return <div className="h-96" />;

  const startOfWeek = (d: Date) => {
    const x = new Date(d);
    const day = x.getDay() === 0 ? 6 : x.getDay() - 1;
    x.setDate(x.getDate() - day);
    return x;
  };

  const weekStart = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  });

  const apptsByDay = (date: string) => appointments.filter((a) => a.date === date).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold">Agenda</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona tus citas y consultas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-surface rounded-xl p-1 flex">
            <button onClick={() => setView("semana")} className={`px-3 py-1.5 text-sm rounded-lg ${view === "semana" ? "bg-card shadow-sm font-medium" : "text-muted-foreground"}`}>Semana</button>
            <button onClick={() => setView("dia")} className={`px-3 py-1.5 text-sm rounded-lg ${view === "dia" ? "bg-card shadow-sm font-medium" : "text-muted-foreground"}`}>Día</button>
          </div>
          {hasPermission("appointments.write") && (
            <button onClick={() => setNewOpen(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/90"><Plus className="h-4 w-4" /> Nueva cita</button>
          )}
        </div>
      </div>

      <NewAppointmentDialog open={newOpen} onOpenChange={setNewOpen} defaultDate={selected || todayISO()} />
      <CompleteAppointmentDialog
        appointment={completeAppt}
        patient={completeAppt ? patients.find((p) => p.id === completeAppt.patientId) : undefined}
        open={!!completeAppt}
        onOpenChange={(o) => !o && setCompleteAppt(null)}
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border bg-card px-4 py-3 text-sm">
        <span className="text-muted-foreground font-medium">Leyenda:</span>
        {AGENDA_LEGEND_STATUSES.map((status) => (
          <div key={status} className="flex items-center gap-2">
            <span
              className={`h-3 w-3 shrink-0 rounded-full ${appointmentStatusLegendClass(status)}`}
              aria-hidden
            />
            <span>{APPOINTMENT_STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <button onClick={() => { const d = new Date(cursor); d.setDate(d.getDate() - 7); setCursor(d); }} className="p-2 rounded-lg hover:bg-surface"><ChevronLeft className="h-4 w-4" /></button>
          <div className="font-medium">
            {weekStart.getDate()} {fmtMonthLong(weekStart)} – {days[6].getDate()} {fmtMonthLong(days[6])} {days[6].getFullYear()}
          </div>
          <button onClick={() => { const d = new Date(cursor); d.setDate(d.getDate() + 7); setCursor(d); }} className="p-2 rounded-lg hover:bg-surface"><ChevronRight className="h-4 w-4" /></button>
        </div>

        {view === "semana" ? (
          <div className="grid grid-cols-7 divide-x">
            {days.map((d) => {
              const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
              const list = apptsByDay(iso);
              const isToday = iso === todayISO();
              return (
                <div key={iso} className="min-h-[420px]">
                  <div className={`px-3 py-2 border-b text-center ${isToday ? "bg-primary/10" : ""}`}>
                    <div className="text-xs uppercase text-muted-foreground">{fmtWeekdayShort(d)}</div>
                    <div className={`font-display text-xl font-semibold ${isToday ? "text-primary" : ""}`}>{d.getDate()}</div>
                  </div>
                  <div className="p-2 space-y-1.5">
                    {list.map((a) => {
                      const p = patients.find((x) => x.id === a.patientId)!;
                      const franklSummary = franklMap.get(a.patientId);
                      return (
                        <div
                          key={a.id}
                          onClick={() => { setSelected(iso); setView("dia"); }}
                          className={`cursor-pointer p-2 rounded-lg border ${appointmentStatusCardClass(a.status)}`}
                        >
                          <div className={`text-xs font-semibold ${appointmentStatusTimeClass(a.status)}`}>{a.time}</div>
                          <div className="text-xs font-medium truncate mt-0.5 flex items-center gap-1 flex-wrap">
                            {p.name}
                            {shouldShowFranklBadge(franklSummary) && franklSummary?.latestFrankl && (
                              <FranklBadge frankl={franklSummary.latestFrankl} summary={franklSummary} className="text-[10px] px-1.5 py-0" />
                            )}
                            {a.scheduledBy === "patient" && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 px-1 rounded">
                                Paciente
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">{a.reason}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6">
            <input type="date" value={selected} onChange={(e) => setSelected(e.target.value)} className="mb-4 px-3 py-2 rounded-lg bg-surface border text-sm" />
            <div className="space-y-2">
              {apptsByDay(selected).length === 0 && <div className="text-sm text-muted-foreground py-8 text-center">Sin citas este día.</div>}
              {apptsByDay(selected).map((a) => {
                const p = patients.find((x) => x.id === a.patientId)!;
                const franklSummary = franklMap.get(a.patientId);
                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-4 p-3 rounded-xl border-l-4 ${appointmentStatusRowClass(a.status)}`}
                  >
                    <div className={`font-display text-lg font-semibold w-16 ${appointmentStatusTimeClass(a.status)}`}>{a.time}</div>
                    <PatientAvatar patient={p} />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2 flex-wrap">
                        {p.name}
                        {shouldShowFranklBadge(franklSummary) && franklSummary?.latestFrankl && (
                          <FranklBadge frankl={franklSummary.latestFrankl} summary={franklSummary} />
                        )}
                        {a.scheduledBy === "patient" && (
                          <span className="text-[10px] font-normal bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 px-1.5 py-0.5 rounded">
                            Solicitud del paciente
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{a.reason}</div>
                    </div>
                    <StatusBadge status={a.status} />
                    {hasPermission("appointments.write") && a.status !== "completada" && (
                      <button onClick={() => setCompleteAppt(a)} className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground rounded-md px-2.5 py-1.5 font-medium hover:bg-primary/90">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Completar
                      </button>
                    )}
                    {hasPermission("appointments.write") ? (
                      <select value={a.status} onChange={(e) => {
                        const v = e.target.value as Appointment["status"];
                        if (v === "completada") setCompleteAppt(a);
                        else setAppointmentStatus(a.id, v);
                      }} className="text-xs border rounded-md px-2 py-1 bg-card">
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    ) : (
                      <span className="text-xs text-muted-foreground capitalize">{a.status}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
