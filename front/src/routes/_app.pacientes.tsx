import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { tenantKey } from "@/lib/tenantQuery";
import { Search, Plus, AlertCircle, Eye, Pill, Trash2, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { PatientAvatar } from "@/components/clinical/PatientAvatar";
import { fmtShort } from "@/lib/format";
import { NewPatientDialog } from "@/components/clinical/NewPatientDialog";
import { PatientQuickViewDialog } from "@/components/clinical/PatientQuickViewDialog";
import { QuickPrescriptionDialog } from "@/components/prescription/QuickPrescriptionDialog";
import { DeletePatientDialog } from "@/components/clinical/DeletePatientDialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { getVisiblePages } from "@/lib/pagination";

const PAGE_SIZE = 20;

type GenderFilter = "" | "M" | "F";
type YesNoFilter = "" | "yes" | "no";
type LastVisitFilter = "" | "recent" | "overdue";
type AgeFilter = "" | "0-5" | "6-12" | "13+";
type SortOption = "name_asc" | "name_desc" | "age_asc" | "age_desc" | "lastVisit_desc" | "lastVisit_asc";

const SORT_LABELS: Record<SortOption, string> = {
  name_asc: "Nombre A → Z",
  name_desc: "Nombre Z → A",
  age_asc: "Edad menor a mayor",
  age_desc: "Edad mayor a menor",
  lastVisit_desc: "Última visita reciente",
  lastVisit_asc: "Última visita antigua",
};

function parseSortOption(option: SortOption): { sortBy: "name" | "age" | "lastVisit"; sortDir: "asc" | "desc" } {
  const [sortBy, sortDir] = option.split("_") as ["name" | "age" | "lastVisit", "asc" | "desc"];
  return { sortBy, sortDir };
}

function ageFilterToRange(filter: AgeFilter): { ageMin?: number; ageMax?: number } {
  if (filter === "0-5") return { ageMin: 0, ageMax: 5 };
  if (filter === "6-12") return { ageMin: 6, ageMax: 12 };
  if (filter === "13+") return { ageMin: 13 };
  return {};
}

const selectClass =
  "h-10 rounded-lg bg-surface border px-3 text-sm outline-none focus:ring-2 focus:ring-ring min-w-[10rem]";

export const Route = createFileRoute("/_app/pacientes")({
  head: () => ({ meta: [{ title: "Pacientes — MediFlow" }] }),
  component: PatientsRoute,
});

function PatientsRoute() {
  const location = useLocation();

  if (location.pathname !== "/pacientes") {
    return <Outlet />;
  }

  return <PatientsPage />;
}

function PatientsPage() {
  const { hasPermission, user, ready } = useAuth();
  const brandingId = user?.brandingId;
  const canDelete = hasPermission("patients.delete");
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [gender, setGender] = useState<GenderFilter>("");
  const [allergies, setAllergies] = useState<YesNoFilter>("");
  const [conditions, setConditions] = useState<YesNoFilter>("");
  const [lastVisit, setLastVisit] = useState<LastVisitFilter>("");
  const [ageFilter, setAgeFilter] = useState<AgeFilter>("");
  const [sort, setSort] = useState<SortOption>("name_asc");
  const [newOpen, setNewOpen] = useState(false);
  const [quickId, setQuickId] = useState<string | null>(null);
  const [rxId, setRxId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { sortBy, sortDir } = parseSortOption(sort);
  const ageRange = ageFilterToRange(ageFilter);

  const patientsQ = useQuery({
    queryKey: [
      ...tenantKey(["patients", "list"], brandingId),
      page,
      q,
      gender,
      allergies,
      conditions,
      lastVisit,
      ageFilter,
      sort,
    ],
    queryFn: () =>
      api.patients.listPage({
        q: q || undefined,
        gender: gender || undefined,
        allergies: allergies || undefined,
        conditions: conditions || undefined,
        lastVisit: lastVisit || undefined,
        ageMin: ageRange.ageMin,
        ageMax: ageRange.ageMax,
        sortBy,
        sortDir,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
    enabled: ready && !!user,
    placeholderData: (prev) => prev,
  });

  const patients = patientsQ.data?.data ?? [];
  const meta = patientsQ.data?.meta;
  const total = meta?.total ?? 0;
  const offset = meta?.offset ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const deletePatient = patients.find((p) => p.id === deleteId) ?? null;

  useEffect(() => {
    if (patients.length === 0 && page > 1 && !patientsQ.isFetching) {
      setPage((p) => p - 1);
    }
  }, [patients.length, page, patientsQ.isFetching]);

  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = total === 0 ? 0 : offset + patients.length;

  const hasActiveFilters =
    !!q || !!gender || !!allergies || !!conditions || !!lastVisit || !!ageFilter || sort !== "name_asc";

  function resetFilters() {
    setQ("");
    setGender("");
    setAllergies("");
    setConditions("");
    setLastVisit("");
    setAgeFilter("");
    setSort("name_asc");
    setPage(1);
  }

  function updateFilter<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold">Pacientes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {patientsQ.isLoading ? "Cargando..." : `${total} pacientes registrados`}
          </p>
        </div>
        {hasPermission("patients.write") && (
          <button onClick={() => setNewOpen(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Nuevo paciente
          </button>
        )}
      </div>

      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="p-4 border-b space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => updateFilter(setQ, e.target.value)}
                placeholder="Buscar por nombre o tutor..."
                className="w-full pl-10 pr-4 h-10 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="h-4 w-4" />
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            <span className="font-medium">Filtros y orden</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={gender}
              onChange={(e) => updateFilter(setGender, e.target.value as GenderFilter)}
              className={selectClass}
            >
              <option value="">Todos los géneros</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>

            <select
              value={ageFilter}
              onChange={(e) => updateFilter(setAgeFilter, e.target.value as AgeFilter)}
              className={selectClass}
            >
              <option value="">Todas las edades</option>
              <option value="0-5">0–5 años</option>
              <option value="6-12">6–12 años</option>
              <option value="13+">13+ años</option>
            </select>

            <select
              value={allergies}
              onChange={(e) => updateFilter(setAllergies, e.target.value as YesNoFilter)}
              className={selectClass}
            >
              <option value="">Todas las alergias</option>
              <option value="yes">Con alergias</option>
              <option value="no">Sin alergias</option>
            </select>

            <select
              value={conditions}
              onChange={(e) => updateFilter(setConditions, e.target.value as YesNoFilter)}
              className={selectClass}
            >
              <option value="">Todos los antecedentes</option>
              <option value="yes">Con antecedentes</option>
              <option value="no">Sin antecedentes</option>
            </select>

            <select
              value={lastVisit}
              onChange={(e) => updateFilter(setLastVisit, e.target.value as LastVisitFilter)}
              className={selectClass}
            >
              <option value="">Todas las visitas</option>
              <option value="recent">Visitados recientemente</option>
              <option value="overdue">Sin control (+6 meses)</option>
            </select>

            <select
              value={sort}
              onChange={(e) => updateFilter(setSort, e.target.value as SortOption)}
              className={cn(selectClass, "min-w-[12rem]")}
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={cn("overflow-x-auto", patientsQ.isFetching && "opacity-60")}>
          <table className="w-full text-sm">
            <thead className="bg-surface/60 text-muted-foreground">
              <tr className="text-left">
                <th className="px-6 py-3 font-medium">Paciente</th>
                <th className="px-6 py-3 font-medium">Edad</th>
                <th className="px-6 py-3 font-medium">Tutor</th>
                <th className="px-6 py-3 font-medium">Alergias</th>
                <th className="px-6 py-3 font-medium">Última visita</th>
                <th className="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {patientsQ.isError && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-destructive">
                    No se pudo cargar la lista de pacientes.
                  </td>
                </tr>
              )}
              {!patientsQ.isError && patients.map((p) => (
                <tr key={p.id} className="border-t hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-3">
                    <Link to="/pacientes/$id" params={{ id: p.id }} className="flex items-center gap-3">
                      <PatientAvatar patient={p} size={36} />
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.gender === "F" ? "Femenino" : "Masculino"} · {p.bloodType}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-3">{p.age} años</td>
                  <td className="px-6 py-3">
                    <div>{p.guardian}</div>
                    <div className="text-xs text-muted-foreground">{p.guardianPhone}</div>
                  </td>
                  <td className="px-6 py-3">
                    {p.allergies.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {p.allergies.map((a) => (
                          <span key={a} className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                            <AlertCircle className="h-3 w-3" /> {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{fmtShort(p.lastVisit)}</td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setQuickId(p.id)} title="Vista rápida" className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => setRxId(p.id)} title="Nueva receta" className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary">
                        <Pill className="h-4 w-4" />
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteId(p.id)}
                          title="Eliminar paciente"
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!patientsQ.isError && !patientsQ.isLoading && patients.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    {hasActiveFilters ? "Sin resultados con los filtros aplicados." : "Sin resultados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

      <NewPatientDialog open={newOpen} onOpenChange={setNewOpen} />
      <PatientQuickViewDialog patientId={quickId} open={!!quickId} onOpenChange={(o) => !o && setQuickId(null)} />
      <QuickPrescriptionDialog patientId={rxId} open={!!rxId} onOpenChange={(o) => !o && setRxId(null)} />
      <DeletePatientDialog
        patient={deletePatient}
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onDeleted={() => setDeleteId(null)}
      />
    </div>
  );
}
