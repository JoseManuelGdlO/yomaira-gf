import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutList,
  Search,
  Stethoscope,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { tenantKey } from "@/lib/tenantQuery";
import { fmtLong } from "@/lib/format";
import { getVisiblePages } from "@/lib/pagination";
import { StatCard } from "@/components/clinical/StatCard";
import { ConsultationCard } from "@/components/clinical/ConsultationCard";
import { ClinicalTimeline } from "@/components/clinical/ClinicalTimeline";
import { PatientQuickViewDialog } from "@/components/clinical/PatientQuickViewDialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type Period = "30d" | "90d" | "year" | "all";
type ViewMode = "list" | "timeline";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function periodToRange(period: Period): { from?: string; to?: string } {
  if (period === "all") return {};
  const today = new Date();
  const to = todayISO();
  const from = new Date(today);
  if (period === "30d") from.setDate(from.getDate() - 30);
  else if (period === "90d") from.setDate(from.getDate() - 90);
  else from.setMonth(0, 1);
  return {
    from: `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`,
    to,
  };
}

const PERIOD_LABELS: Record<Period, string> = {
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
  year: "Este año",
  all: "Todo",
};

export const Route = createFileRoute("/_app/historial")({
  head: () => ({ meta: [{ title: "Historial médico — MediFlow" }] }),
  component: HistorialPage,
});

function HistorialPage() {
  const { user, ready } = useAuth();
  const brandingId = user?.brandingId;
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [patientId, setPatientId] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [quickViewId, setQuickViewId] = useState<string | null>(null);

  const dateRange = useMemo(() => periodToRange(period), [period]);

  const listParams = {
    q: q || undefined,
    patientId: patientId || undefined,
    from: dateRange.from,
    to: dateRange.to,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const consultationsQ = useQuery({
    queryKey: [...tenantKey(["consultations", "list"], brandingId), page, q, patientId, period],
    queryFn: () => api.consultations.listPage(listParams),
    enabled: ready && !!user,
    placeholderData: (prev) => prev,
  });

  const totalQ = useQuery({
    queryKey: [...tenantKey(["consultations", "total"], brandingId)],
    queryFn: () => api.consultations.listPage({ limit: 1, offset: 0 }),
    enabled: ready && !!user,
    staleTime: 60_000,
  });

  const patientsQ = useQuery({
    queryKey: tenantKey(["patients", "all"], brandingId),
    queryFn: () => api.patients.list(),
    enabled: ready && !!user,
    staleTime: 60_000,
  });

  const consultations = consultationsQ.data?.data ?? [];
  const meta = consultationsQ.data?.meta;
  const total = meta?.total ?? 0;
  const offset = meta?.offset ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const totalAll = totalQ.data?.meta.total ?? 0;
  const patients = patientsQ.data ?? [];

  const nextTreatmentOnPage = consultations.filter((c) => c.nextTreatment?.trim()).length;
  const latestConsultation = consultations[0];

  useEffect(() => {
    if (consultations.length === 0 && page > 1 && !consultationsQ.isFetching) {
      setPage((p) => p - 1);
    }
  }, [consultations.length, page, consultationsQ.isFetching]);

  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = total === 0 ? 0 : offset + consultations.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Historial médico</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {consultationsQ.isLoading
            ? "Cargando consultas..."
            : `${totalAll} consultas registradas en la clínica`}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label="Total de consultas"
          value={totalQ.isLoading ? "…" : totalAll}
          hint="Histórico completo"
          accent="primary"
        />
        <StatCard
          icon={Calendar}
          label="En el periodo"
          value={consultationsQ.isLoading ? "…" : total}
          hint={PERIOD_LABELS[period]}
          accent="accent"
        />
        <StatCard
          icon={ClipboardList}
          label="Con próximo tratamiento"
          value={nextTreatmentOnPage}
          hint="En resultados actuales"
          accent="warning"
        />
        <StatCard
          icon={Stethoscope}
          label="Última consulta"
          value={latestConsultation ? fmtLong(latestConsultation.date) : "—"}
          hint={latestConsultation?.patient?.name ?? "Sin registros"}
          accent="success"
        />
      </div>

      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="p-4 border-b space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por paciente, diagnóstico, tratamiento..."
                className="w-full pl-10 pr-4 h-10 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border p-0.5 bg-surface">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <LayoutList className="h-4 w-4" />
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("timeline")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    viewMode === "timeline" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Activity className="h-4 w-4" />
                  Timeline
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={patientId}
              onChange={(e) => {
                setPatientId(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg bg-surface border px-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:max-w-xs"
            >
              <option value="">Todos los pacientes</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setPeriod(key);
                    setPage(1);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                    period === key
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-surface text-muted-foreground hover:text-foreground",
                  )}
                >
                  {PERIOD_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={cn("p-6", consultationsQ.isFetching && "opacity-60")}>
          {consultationsQ.isError && (
            <div className="text-center py-12 text-destructive">
              No se pudo cargar el historial médico.
            </div>
          )}

          {!consultationsQ.isError && consultationsQ.isLoading && (
            <div className="text-center py-12 text-muted-foreground">Cargando consultas...</div>
          )}

          {!consultationsQ.isError && !consultationsQ.isLoading && consultations.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <p className="text-muted-foreground">No hay consultas que coincidan con los filtros.</p>
              <Link
                to="/pacientes"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Users className="h-4 w-4" />
                Ir a pacientes
              </Link>
            </div>
          )}

          {!consultationsQ.isError && consultations.length > 0 && viewMode === "list" && (
            <div className="space-y-4">
              {consultations.map((c) => (
                <ConsultationCard
                  key={c.id}
                  consultation={c}
                  onQuickView={setQuickViewId}
                />
              ))}
            </div>
          )}

          {!consultationsQ.isError && consultations.length > 0 && viewMode === "timeline" && (
            <ClinicalTimeline items={consultations} />
          )}
        </div>

        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Mostrando {rangeStart}–{rangeEnd} de {total}
            </p>
            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      size="default"
                      className={cn("gap-1 pl-2.5", page <= 1 && "pointer-events-none opacity-50")}
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Anterior</span>
                    </PaginationLink>
                  </PaginationItem>
                  {getVisiblePages(page, totalPages).map((p, i) =>
                    p === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          isActive={p === page}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(p);
                          }}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      size="default"
                      className={cn("gap-1 pr-2.5", page >= totalPages && "pointer-events-none opacity-50")}
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages) setPage(page + 1);
                      }}
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="h-4 w-4" />
                    </PaginationLink>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>

      <PatientQuickViewDialog
        patientId={quickViewId}
        open={!!quickViewId}
        onOpenChange={(o) => !o && setQuickViewId(null)}
      />
    </div>
  );
}
