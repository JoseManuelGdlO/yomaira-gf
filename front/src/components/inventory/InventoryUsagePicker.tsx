import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type InventoryUsageInput } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import type { InventoryUsage } from "@/mocks/data";
import { AlertTriangle, Plus, X } from "lucide-react";

export type SelectedUsage = {
  inventoryItemId: string;
  quantity: number;
  itemName: string;
  unit: string;
  available: number;
};

type Props = {
  value: SelectedUsage[];
  onChange: (usages: SelectedUsage[]) => void;
  initialUsages?: InventoryUsage[];
};

export function InventoryUsagePicker({ value, onChange, initialUsages }: Props) {
  const { user, hasPermission } = useAuth();
  const brandingId = user?.brandingId;
  const [pickId, setPickId] = useState("");

  const itemsQ = useQuery({
    queryKey: tenantKey(["inventory", "active"], brandingId),
    queryFn: () => api.inventory.list({ active: true }),
    enabled: !!brandingId && hasPermission("inventory.read"),
  });

  const activeItems = useMemo(
    () => (itemsQ.data ?? []).filter((i) => i.active),
    [itemsQ.data],
  );

  const availableToAdd = activeItems.filter((i) => !value.some((u) => u.inventoryItemId === i.id));

  if (!hasPermission("inventory.read")) return null;

  const addItem = (itemId: string) => {
    const item = activeItems.find((i) => i.id === itemId);
    if (!item || value.some((u) => u.inventoryItemId === itemId)) return;
    onChange([
      ...value,
      {
        inventoryItemId: item.id,
        quantity: 1,
        itemName: item.name,
        unit: item.unit,
        available: item.quantity,
      },
    ]);
    setPickId("");
  };

  const updateQty = (itemId: string, qty: number) => {
    onChange(
      value.map((u) => (u.inventoryItemId === itemId ? { ...u, quantity: Math.max(0.01, qty) } : u)),
    );
  };

  const removeItem = (itemId: string) => {
    onChange(value.filter((u) => u.inventoryItemId !== itemId));
  };

  return (
    <div className="rounded-xl border bg-surface/50 p-3 space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Insumos utilizados</label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Selecciona lo usado en esta consulta para descontarlo del inventario
        </p>
      </div>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((u) => {
            const overStock = u.quantity > u.available;
            return (
              <li
                key={u.inventoryItemId}
                className="flex items-center gap-2 flex-wrap bg-card border rounded-lg p-2"
              >
                <div className="flex-1 min-w-[140px]">
                  <div className="text-sm font-medium">{u.itemName}</div>
                  <div className="text-xs text-muted-foreground">
                    Disponible: {u.available} {u.unit}
                  </div>
                </div>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={u.quantity}
                  onChange={(e) => updateQty(u.inventoryItemId, Number(e.target.value))}
                  className="w-20 h-9 px-2 rounded-lg border text-sm text-center"
                />
                <span className="text-xs text-muted-foreground">{u.unit}</span>
                {overStock && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" /> Stock insuficiente
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeItem(u.inventoryItemId)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  title="Quitar"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {availableToAdd.length > 0 ? (
        <div className="flex gap-2">
          <select
            value={pickId}
            onChange={(e) => {
              const id = e.target.value;
              setPickId(id);
              if (id) addItem(id);
            }}
            className="flex-1 h-10 px-3 rounded-lg bg-card border text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Agregar insumo…</option>
            {availableToAdd.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.quantity} {i.unit})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!pickId}
            onClick={() => pickId && addItem(pickId)}
            className="inline-flex items-center gap-1 px-3 h-10 rounded-lg border bg-card hover:bg-surface text-sm disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      ) : value.length === 0 ? (
        <p className="text-xs text-muted-foreground">No hay insumos activos en inventario.</p>
      ) : null}

      {initialUsages && initialUsages.length > 0 && value.length === 0 && (
        <p className="text-xs text-muted-foreground">Esta consulta no registró insumos.</p>
      )}
    </div>
  );
}

export function toInventoryUsageInputs(usages: SelectedUsage[]): InventoryUsageInput[] {
  return usages.map((u) => ({ inventoryItemId: u.inventoryItemId, quantity: u.quantity }));
}

export function usagesFromConsultation(usages: InventoryUsage[] | undefined): SelectedUsage[] {
  if (!usages?.length) return [];
  return usages.map((u) => ({
    inventoryItemId: u.inventoryItemId,
    quantity: u.quantity,
    itemName: u.itemName ?? "Insumo",
    unit: u.unit ?? "unidades",
    available: u.quantity,
  }));
}
