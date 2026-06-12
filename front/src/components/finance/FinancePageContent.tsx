import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type FinanceCharge, type FinanceExpense } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { formatMoney, monthRange, paymentMethodLabel } from "@/lib/finance";
import { ChargeDialog } from "./ChargeDialog";
import { ExpenseDialog } from "./ExpenseDialog";
import { Pencil, Plus, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";

type Tab = "charges" | "expenses" | "summary";

export function FinancePageContent() {
  const { user, hasPermission } = useAuth();
  const brandingId = user?.brandingId;
  const canWrite = hasPermission("finances.write");
  const qc = useQueryClient();

  const defaultRange = monthRange();
  const [tab, setTab] = useState<Tab>("summary");
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [chargeDialog, setChargeDialog] = useState<{ open: boolean; charge?: FinanceCharge | null }>({ open: false });
  const [expenseDialog, setExpenseDialog] = useState<{ open: boolean; expense?: FinanceExpense | null }>({ open: false });

  const rangeQuery = { from, to };

  const chargesQ = useQuery({
    queryKey: [...tenantKey(["finances", "charges"], brandingId), from, to],
    queryFn: () => api.finances.charges.list(rangeQuery),
    enabled: !!brandingId && (tab === "charges" || tab === "summary"),
  });

  const expensesQ = useQuery({
    queryKey: [...tenantKey(["finances", "expenses"], brandingId), from, to],
    queryFn: () => api.finances.expenses.list(rangeQuery),
    enabled: !!brandingId && (tab === "expenses" || tab === "summary"),
  });

  const summaryQ = useQuery({
    queryKey: [...tenantKey(["finances", "summary"], brandingId), from, to],
    queryFn: () => api.finances.summary(rangeQuery),
    enabled: !!brandingId && tab === "summary",
  });

  const patientsQ = useQuery({
    queryKey: tenantKey(["patients"], brandingId),
    queryFn: () => api.patients.list(),
    enabled: !!brandingId,
  });

  const patientNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of patientsQ.data ?? []) map.set(p.id, p.name);
    return map;
  }, [patientsQ.data]);

  const deleteChargeM = useMutation({
    mutationFn: (id: string) => api.finances.charges.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKey(["finances"], brandingId) });
      toast.success("Cobro eliminado");
    },
    onError: () => toast.error("No se pudo eliminar el cobro"),
  });

  const deleteExpenseM = useMutation({
    mutationFn: (id: string) => api.finances.expenses.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKey(["finances"], brandingId) });
      toast.success("Gasto eliminado");
    },
    onError: () => toast.error("No se pudo eliminar el gasto"),
  });

  const charges = chargesQ.data ?? [];
  const expenses = expensesQ.data ?? [];
  const summary = summaryQ.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" />
            Finanzas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Cobros de consultas, gastos del consultorio y balance del periodo.</p>
        </div>
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["summary", "Resumen"],
            ["charges", "Cobros"],
            ["expenses", "Gastos"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              tab === id ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-surface"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="grid sm:grid-cols-3 gap-4">
          <SummaryCard
            title="Total cobros"
            value={formatMoney(summary?.totalCharges ?? 0)}
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            loading={summaryQ.isLoading}
          />
          <SummaryCard
            title="Total gastos"
            value={formatMoney(summary?.totalExpenses ?? 0)}
            icon={<TrendingDown className="h-5 w-5 text-rose-600" />}
            loading={summaryQ.isLoading}
          />
          <SummaryCard
            title="Balance"
            value={formatMoney(summary?.balance ?? 0)}
            icon={<Wallet className="h-5 w-5 text-primary" />}
            loading={summaryQ.isLoading}
            highlight
          />
        </div>
      )}

      {tab === "charges" && (
        <section className="bg-card border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="font-medium">Cobros</h2>
            {canWrite && (
              <button
                type="button"
                onClick={() => setChargeDialog({ open: true, charge: null })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Nuevo cobro
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-surface/50 text-left text-muted-foreground">
                  <th className="p-3 font-medium">Fecha</th>
                  <th className="p-3 font-medium">Paciente</th>
                  <th className="p-3 font-medium">Monto</th>
                  <th className="p-3 font-medium">Método</th>
                  <th className="p-3 font-medium">Nota</th>
                  {canWrite && <th className="p-3 font-medium w-24" />}
                </tr>
              </thead>
              <tbody>
                {chargesQ.isLoading && (
                  <tr>
                    <td colSpan={canWrite ? 6 : 5} className="p-6 text-center text-muted-foreground">
                      Cargando…
                    </td>
                  </tr>
                )}
                {!chargesQ.isLoading && charges.length === 0 && (
                  <tr>
                    <td colSpan={canWrite ? 6 : 5} className="p-6 text-center text-muted-foreground">
                      No hay cobros en este periodo.
                    </td>
                  </tr>
                )}
                {charges.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-surface/30">
                    <td className="p-3 whitespace-nowrap">{c.date}</td>
                    <td className="p-3">
                      <Link to="/pacientes/$id" params={{ id: c.patientId }} search={{}} className="text-primary hover:underline">
                        {c.patient?.name ?? patientNameById.get(c.patientId) ?? "Paciente"}
                      </Link>
                    </td>
                    <td className="p-3 font-medium">{formatMoney(c.amount)}</td>
                    <td className="p-3">{paymentMethodLabel(c.paymentMethod)}</td>
                    <td className="p-3 max-w-xs truncate" title={c.note}>
                      {c.note || "—"}
                    </td>
                    {canWrite && (
                      <td className="p-3">
                        <div className="flex gap-1">
                          {!c.consultationId && (
                            <>
                              <button
                                type="button"
                                onClick={() => setChargeDialog({ open: true, charge: c })}
                                className="p-1.5 rounded-md hover:bg-surface"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("¿Eliminar este cobro?")) deleteChargeM.mutate(c.id);
                                }}
                                className="p-1.5 rounded-md hover:bg-surface text-destructive"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {c.consultationId && (
                            <span className="text-xs text-muted-foreground">Desde consulta</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "expenses" && (
        <section className="bg-card border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="font-medium">Gastos</h2>
            {canWrite && (
              <button
                type="button"
                onClick={() => setExpenseDialog({ open: true, expense: null })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Nuevo gasto
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-surface/50 text-left text-muted-foreground">
                  <th className="p-3 font-medium">Fecha</th>
                  <th className="p-3 font-medium">Categoría</th>
                  <th className="p-3 font-medium">Descripción</th>
                  <th className="p-3 font-medium">Monto</th>
                  {canWrite && <th className="p-3 font-medium w-24" />}
                </tr>
              </thead>
              <tbody>
                {expensesQ.isLoading && (
                  <tr>
                    <td colSpan={canWrite ? 5 : 4} className="p-6 text-center text-muted-foreground">
                      Cargando…
                    </td>
                  </tr>
                )}
                {!expensesQ.isLoading && expenses.length === 0 && (
                  <tr>
                    <td colSpan={canWrite ? 5 : 4} className="p-6 text-center text-muted-foreground">
                      No hay gastos en este periodo.
                    </td>
                  </tr>
                )}
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-surface/30">
                    <td className="p-3 whitespace-nowrap">{e.date}</td>
                    <td className="p-3">{e.category || "—"}</td>
                    <td className="p-3 max-w-md truncate" title={e.description}>
                      {e.description || "—"}
                    </td>
                    <td className="p-3 font-medium">{formatMoney(e.amount)}</td>
                    {canWrite && (
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setExpenseDialog({ open: true, expense: e })}
                            className="p-1.5 rounded-md hover:bg-surface"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("¿Eliminar este gasto?")) deleteExpenseM.mutate(e.id);
                            }}
                            className="p-1.5 rounded-md hover:bg-surface text-destructive"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ChargeDialog
        open={chargeDialog.open}
        onOpenChange={(open) => setChargeDialog((s) => ({ ...s, open }))}
        charge={chargeDialog.charge}
      />
      <ExpenseDialog
        open={expenseDialog.open}
        onOpenChange={(open) => setExpenseDialog((s) => ({ ...s, open }))}
        expense={expenseDialog.expense}
      />
    </div>
  );
}

function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Desde</label>
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="mt-1 block h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Hasta</label>
        <input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="mt-1 block h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  loading,
  highlight,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  loading?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "bg-primary/5 border-primary/20" : "bg-card"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        {icon}
      </div>
      <div className="mt-3 font-display text-2xl font-semibold">{loading ? "…" : value}</div>
    </div>
  );
}
