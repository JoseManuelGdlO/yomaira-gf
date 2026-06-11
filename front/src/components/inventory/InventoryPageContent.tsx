import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, type InventoryItem } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { InventoryItemDialog } from "./InventoryItemDialog";
import { RestockDialog } from "./RestockDialog";
import { InventoryItemActionDialog } from "./InventoryItemActionDialog";
import { AlertTriangle, Ban, PackagePlus, Pencil, Plus, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

function stockBadge(item: InventoryItem) {
  if (!item.active) {
    return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inactivo</span>;
  }
  if (item.isLowStock || item.quantity <= item.minQuantity) {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
        Bajo stock
      </span>
    );
  }
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
      OK
    </span>
  );
}

export function InventoryPageContent() {
  const { user, hasPermission } = useAuth();
  const brandingId = user?.brandingId;
  const canWrite = hasPermission("inventory.write");
  const qc = useQueryClient();

  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [hideInactive, setHideInactive] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [actionMode, setActionMode] = useState<"deactivate" | "delete" | null>(null);

  const itemsQ = useQuery({
    queryKey: [...tenantKey(["inventory"], brandingId), lowStockOnly ? "low" : "all"],
    queryFn: () => api.inventory.list(lowStockOnly ? { lowStock: true } : undefined),
    enabled: !!brandingId,
  });

  const allItems = itemsQ.data ?? [];
  const items = useMemo(() => {
    if (hideInactive) return allItems.filter((i) => i.active);
    return allItems;
  }, [allItems, hideInactive]);
  const lowCount = useMemo(
    () => allItems.filter((i) => i.active && (i.isLowStock || i.quantity <= i.minQuantity)).length,
    [allItems],
  );

  const openAction = (item: InventoryItem, mode: "deactivate" | "delete") => {
    setDeleteItem(item);
    setActionMode(mode);
  };

  const closeAction = () => {
    setDeleteItem(null);
    setActionMode(null);
  };

  const deactivateM = useMutation({
    mutationFn: (id: string) => api.inventory.update(id, { active: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKey(["inventory"], brandingId) });
      toast.success("Insumo desactivado");
      closeAction();
    },
    onError: () => toast.error("No se pudo desactivar el insumo"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => api.inventory.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKey(["inventory"], brandingId) });
      toast.success("Insumo eliminado permanentemente");
      closeAction();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 404) {
        qc.invalidateQueries({ queryKey: tenantKey(["inventory"], brandingId) });
        toast.error("El insumo ya no existe. Actualizando lista…");
        closeAction();
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        toast.error(err.message);
        return;
      }
      toast.error("No se pudo eliminar el insumo");
    },
  });

  const reactivateM = useMutation({
    mutationFn: (id: string) => api.inventory.update(id, { active: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKey(["inventory"], brandingId) });
      toast.success("Insumo reactivado");
    },
    onError: () => toast.error("No se pudo reactivar el insumo"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold">Inventario</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {allItems.length} insumos registrados
            {lowCount > 0 && ` · ${lowCount} con stock bajo`}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Nuevo insumo
          </button>
        )}
      </div>

      {lowCount > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100">
              {lowCount} {lowCount === 1 ? "insumo necesita" : "insumos necesitan"} reabastecimiento
            </p>
            <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-0.5">
              Revisa los items marcados en amarillo y agrega stock antes de que se agoten.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="rounded border"
          />
          Solo bajo stock
        </label>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={hideInactive}
            onChange={(e) => setHideInactive(e.target.checked)}
            className="rounded border"
          />
          Ocultar inactivos
        </label>
        <button
          type="button"
          onClick={() => itemsQ.refetch()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Actualizar
        </button>
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-surface/80 text-left text-muted-foreground border-b">
                <th className="p-3 font-medium">Insumo</th>
                <th className="p-3 font-medium">Categoría</th>
                <th className="p-3 font-medium">Stock</th>
                <th className="p-3 font-medium">Mínimo</th>
                <th className="p-3 font-medium">Estado</th>
                {canWrite && <th className="p-3 font-medium w-48">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {itemsQ.isLoading ? (
                <tr>
                  <td colSpan={canWrite ? 6 : 5} className="p-8 text-center text-muted-foreground">
                    Cargando inventario…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 6 : 5} className="p-8 text-center text-muted-foreground">
                    {lowStockOnly ? "No hay insumos con stock bajo." : "Sin insumos registrados."}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-border/50 hover:bg-surface/40 align-middle ${!item.active ? "opacity-70" : ""}`}
                  >
                    <td className="p-3">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.unit}</div>
                    </td>
                    <td className="p-3 capitalize">{item.category || "—"}</td>
                    <td className="p-3 font-semibold tabular-nums">{item.quantity}</td>
                    <td className="p-3 tabular-nums text-muted-foreground">{item.minQuantity}</td>
                    <td className="p-3">{stockBadge(item)}</td>
                    {canWrite && (
                      <td className="p-3">
                        <div className="flex gap-1">
                          {item.active && (
                            <button
                              type="button"
                              title="Reabastecer"
                              onClick={() => setRestockItem(item)}
                              className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary"
                            >
                              <PackagePlus className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Editar"
                            onClick={() => setEditItem(item)}
                            className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {item.active ? (
                            <button
                              type="button"
                              title="Desactivar"
                              onClick={() => openAction(item, "deactivate")}
                              className="p-2 rounded-lg hover:bg-amber-500/10 text-muted-foreground hover:text-amber-700"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Reactivar"
                              onClick={() => reactivateM.mutate(item.id)}
                              disabled={reactivateM.isPending}
                              className="p-2 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Eliminar permanentemente"
                            onClick={() => openAction(item, "delete")}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InventoryItemDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />
      <InventoryItemDialog
        mode="edit"
        item={editItem}
        open={!!editItem}
        onOpenChange={(o) => !o && setEditItem(null)}
      />
      <RestockDialog
        item={restockItem}
        open={!!restockItem}
        onOpenChange={(o) => !o && setRestockItem(null)}
      />
      <InventoryItemActionDialog
        item={deleteItem}
        mode={actionMode}
        open={!!deleteItem && !!actionMode}
        onOpenChange={(o) => !o && closeAction()}
        pending={deactivateM.isPending || deleteM.isPending}
        onConfirm={() => {
          if (!deleteItem || !actionMode) return;
          if (actionMode === "deactivate") deactivateM.mutate(deleteItem.id);
          else deleteM.mutate(deleteItem.id);
        }}
      />
    </div>
  );
}
