import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type BudgetItem } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export function BudgetEditor({
  patientId,
  toothTreatments,
  readOnly = false,
  onDirtyChange,
  onRegisterSave,
}: {
  patientId: string;
  toothTreatments?: Record<string, string>;
  readOnly?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onRegisterSave?: (save: () => Promise<unknown>) => void;
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const brandingId = user?.brandingId;
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [notes, setNotes] = useState("");
  const [dirty, setDirty] = useState(false);

  const budgetQ = useQuery({
    queryKey: tenantKey(["budget", patientId], brandingId),
    queryFn: () => api.budget.get(patientId),
    enabled: !!patientId,
  });

  useEffect(() => {
    setDirty(false);
    onDirtyChange?.(false);
  }, [patientId, onDirtyChange]);

  useEffect(() => {
    if (budgetQ.data && !dirty) {
      setItems(budgetQ.data.items ?? []);
      setNotes(budgetQ.data.notes ?? "");
    }
  }, [budgetQ.data, dirty]);

  const saveM = useMutation({
    mutationFn: (payload: { items: BudgetItem[]; notes: string }) =>
      api.budget.upsert(patientId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKey(["budget", patientId], brandingId) });
      setDirty(false);
      onDirtyChange?.(false);
      toast.success("Presupuesto guardado");
    },
    onError: () => toast.error("No se pudo guardar el presupuesto"),
  });

  useEffect(() => {
    if (readOnly) return;
    onRegisterSave?.(() => saveM.mutateAsync({ items, notes }));
  }, [items, notes, readOnly, onRegisterSave, saveM]);

  const markDirty = () => {
    if (readOnly) return;
    if (!dirty) {
      setDirty(true);
      onDirtyChange?.(true);
    }
  };

  const updateItems = (next: BudgetItem[]) => {
    setItems(next);
    markDirty();
  };

  const total = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);

  const importFromChart = () => {
    if (!toothTreatments) return;
    const existing = new Set(items.map((i) => i.tooth).filter(Boolean));
    const imported: BudgetItem[] = [];
    for (const [tooth, desc] of Object.entries(toothTreatments)) {
      if (!desc.trim() || existing.has(tooth)) continue;
      imported.push({ description: desc.trim(), tooth, amount: 0 });
    }
    if (imported.length === 0) {
      toast.info("No hay piezas nuevas con tratamiento en el odontograma");
      return;
    }
    updateItems([...items, ...imported]);
    toast.success(`${imported.length} línea(s) importadas`);
  };

  if (budgetQ.isLoading) {
    return <div className="text-sm text-muted-foreground py-4">Cargando presupuesto…</div>;
  }

  return (
    <div className="bg-card border rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="font-display text-lg font-semibold">Presupuesto</h3>
        {!readOnly && toothTreatments && Object.keys(toothTreatments).length > 0 && (
          <button
            type="button"
            onClick={importFromChart}
            className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
          >
            <Download className="h-4 w-4" /> Importar desde odontograma
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-2 font-medium">Tratamiento</th>
              <th className="pb-2 pr-2 font-medium w-20">Pieza</th>
              <th className="pb-2 pr-2 font-medium w-28">Importe</th>
              {!readOnly && <th className="pb-2 w-10" />}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-border/50">
                <td className="py-2 pr-2">
                  <input
                    value={item.description}
                    disabled={readOnly}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...item, description: e.target.value };
                      updateItems(next);
                    }}
                    className="w-full h-9 px-2 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-70"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    value={item.tooth ?? ""}
                    disabled={readOnly}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...item, tooth: e.target.value || undefined };
                      updateItems(next);
                    }}
                    className="w-full h-9 px-2 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-70"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.amount || ""}
                    disabled={readOnly}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...item, amount: parseFloat(e.target.value) || 0 };
                      updateItems(next);
                    }}
                    className="w-full h-9 px-2 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-70"
                  />
                </td>
                {!readOnly && (
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => updateItems(items.filter((_, i) => i !== idx))}
                      className="p-2 rounded-lg text-destructive hover:bg-destructive/10"
                      title="Eliminar línea"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={() => updateItems([...items, { description: "", amount: 0 }])}
          className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
        >
          <Plus className="h-4 w-4" /> Agregar línea
        </button>
      )}

      <div className="flex justify-end pt-2 border-t">
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="font-display text-2xl font-semibold text-primary">{formatMoney(total)}</div>
        </div>
      </div>

      {!readOnly && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Notas del presupuesto</label>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              markDirty();
            }}
            rows={2}
            className="mt-1 w-full p-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
          />
        </div>
      )}
    </div>
  );
}

export function useTreatmentBudget(patientId: string) {
  return useQuery({
    queryKey: ["budget", patientId],
    queryFn: () => api.budget.get(patientId),
    enabled: !!patientId,
  });
}
