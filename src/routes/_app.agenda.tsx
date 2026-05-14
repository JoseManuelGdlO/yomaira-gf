import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { PatientAvatar } from "@/components/clinical/PatientAvatar";
import { StatusBadge } from "@/components/clinical/StatusBadge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { fmtMonthLong, fmtWeekdayShort, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_app/agenda")({
  head: () => ({ meta: [{ title: "Agenda — MedFlow" }] }),
  component: AgendaPage,
});

function AgendaPage() {
  const { appointments, patients, setAppointmentStatus } = useStore();
  const [cursor, setCursor] = useState<Date | null>(null);
  const [view, setView] = useState<"semana" | "dia">("semana");
  const [selected, setSelected] = useState<string>("");
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
          <button onClick={() => toast.success("Nueva cita (demo)")} className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/90"><Plus className="h-4 w-4" /> Nueva cita</button>
        </div>
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
                      return (
                        <div key={a.id} onClick={() => { setSelected(iso); setView("dia"); }} className="cursor-pointer p-2 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10">
                          <div className="text-xs font-semibold text-primary">{a.time}</div>
                          <div className="text-xs font-medium truncate mt-0.5">{p.name}</div>
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
                return (
                  <div key={a.id} className="flex items-center gap-4 p-3 bg-surface rounded-xl">
                    <div className="font-display text-lg font-semibold w-16 text-primary">{a.time}</div>
                    <PatientAvatar patient={p} />
                    <div className="flex-1">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm text-muted-foreground">{a.reason}</div>
                    </div>
                    <StatusBadge status={a.status} />
                    <select value={a.status} onChange={(e) => setAppointmentStatus(a.id, e.target.value as any)} className="text-xs border rounded-md px-2 py-1 bg-card">
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmada">Confirmada</option>
                      <option value="completada">Completada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
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
