import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { api, type InventoryItem } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { toast } from "sonner";

type Props = {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

export function RestockDialog({ item, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const brandingId = user?.brandingId;
  const [addQuantity, setAddQuantity] = useState("");

  const restockM = useMutation({
    mutationFn: () => api.inventory.restock(item!.id, Number(addQuantity)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKey(["inventory"], brandingId) });
      toast.success("Stock actualizado");
      setAddQuantity("");
      onOpenChange(false);
    },
    onError: () => toast.error("No se pudo reabastecer"),
  });

  const submit = () => {
    const qty = Number(addQuantity);
    if (!qty || qty <= 0) return toast.error("Captura una cantidad válida");
    restockM.mutate();
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Reabastecer</DialogTitle>
          <DialogDescription>
            {item.name} — stock actual: <strong>{item.quantity}</strong> {item.unit}
          </DialogDescription>
        </DialogHeader>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Cantidad a agregar</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={addQuantity}
            onChange={(e) => setAddQuantity(e.target.value)}
            placeholder="Ej. 10"
            className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium border bg-card hover:bg-surface"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={restockM.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            Agregar stock
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
