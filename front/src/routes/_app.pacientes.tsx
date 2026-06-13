import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { tenantKey } from "@/lib/tenantQuery";
import { Search, Plus, AlertCircle, Eye, Pill, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [newOpen, setNewOpen] = useState(false);
  const [quickId, setQuickId] = useState<string | null>(null);
  const [rxId, setRxId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const patientsQ = useQuery({
    queryKey: [...tenantKey(["patients", "list"], brandingId), page, q],
    queryFn: () =>
      api.patients.listPage({
        q: q || undefined,
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
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre o tutor..."
              className="w-full pl-10 pr-4 h-10 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
            />
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
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Sin resultados.</td></tr>
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
