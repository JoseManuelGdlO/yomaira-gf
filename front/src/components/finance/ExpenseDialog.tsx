import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, type FinanceExpense } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { monthRange, parseAmountInput } from "@/lib/finance";
import { toast } from "sonner";
import { todayISO } from "@/lib/format";

export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  expense?: FinanceExpense | null;
}) {
  const { user } = useAuth();
  const brandingId = user?.brandingId;
  const qc = useQueryClient();
  const isEdit = !!expense;

  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setDate(expense.date);
      setAmount(String(expense.amount));
      setCategory(expense.category ?? "");
      setDescription(expense.description ?? "");
    } else {
      setDate(todayISO());
      setAmount("");
      setCategory("");
      setDescription("");
    }
  }, [open, expense]);

  const saveM = useMutation({
    mutationFn: async () => {
      const parsed = parseAmountInput(amount);
      if (!parsed) throw new Error("Captura un monto válido");
      const body = {
        date,
        amount: parsed,
        category: category.trim(),
        description: description.trim(),
      };
      if (isEdit && expense) return api.finances.expenses.update(expense.id, body);
      return api.finances.expenses.create(body);
    },
    onSuccess: () => {
      const range = monthRange();
      qc.invalidateQueries({ queryKey: tenantKey(["finances"], brandingId) });
      qc.invalidateQueries({ queryKey: [...tenantKey(["finances", "expenses"], brandingId)] });
      qc.invalidateQueries({ queryKey: [...tenantKey(["finances", "summary"], brandingId), range.from, range.to] });
      toast.success(isEdit ? "Gasto actualizado" : "Gasto registrado");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message || "No se pudo guardar el gasto"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Fecha *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Monto *</label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ej. 1500"
              className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Categoría</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ej. Insumos, renta, servicios"
              className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detalle del gasto…"
              className="mt-1 w-full p-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg text-sm font-medium border bg-card hover:bg-surface">
            Cancelar
          </button>
          <button
            onClick={() => saveM.mutate()}
            disabled={saveM.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            Guardar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
