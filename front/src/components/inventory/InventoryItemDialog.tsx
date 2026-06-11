import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { api, type InventoryItem } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { toast } from "sonner";

const CATEGORIES = ["material", "anestesia", "protección", "otro"];

type Props = {
  mode: "create" | "edit";
  item?: InventoryItem | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

export function InventoryItemDialog({ mode, item, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const brandingId = user?.brandingId;

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("unidades");
  const [quantity, setQuantity] = useState("0");
  const [minQuantity, setMinQuantity] = useState("5");
  const [category, setCategory] = useState("material");

  const resetForm = () => {
    if (mode === "edit" && item) {
      setName(item.name);
      setUnit(item.unit);
      setQuantity(String(item.quantity));
      setMinQuantity(String(item.minQuantity));
      setCategory(item.category || "material");
    } else {
      setName("");
      setUnit("unidades");
      setQuantity("0");
      setMinQuantity("5");
      setCategory("material");
    }
  };

  const saveM = useMutation({
    mutationFn: async () => {
      const body = {
        name: name.trim(),
        unit: unit.trim() || "unidades",
        quantity: Number(quantity) || 0,
        minQuantity: Number(minQuantity) || 0,
        category: category.trim(),
        active: item?.active ?? true,
      };
      if (mode === "edit" && item) {
        return api.inventory.update(item.id, body);
      }
      return api.inventory.create(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKey(["inventory"], brandingId) });
      toast.success(mode === "create" ? "Insumo creado" : "Insumo actualizado");
      onOpenChange(false);
    },
    onError: () => toast.error("No se pudo guardar el insumo"),
  });

  const handleOpenChange = (o: boolean) => {
    if (o) resetForm();
    onOpenChange(o);
  };

  const submit = () => {
    if (!name.trim()) return toast.error("Captura el nombre del insumo");
    saveM.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {mode === "create" ? "Nuevo insumo" : "Editar insumo"}
          </DialogTitle>
          <DialogDescription>Material o insumo clínico del consultorio</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Nombre *" value={name} onChange={setName} placeholder="Ej. Resina compuesta A2" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unidad" value={unit} onChange={setUnit} placeholder="unidades, ml, cajas…" />
            <div>
              <label className="text-xs font-medium text-muted-foreground">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Stock actual"
              value={quantity}
              onChange={setQuantity}
              type="number"
              min="0"
              step="0.01"
            />
            <Field
              label="Mínimo (alerta)"
              value={minQuantity}
              onChange={setMinQuantity}
              type="number"
              min="0"
              step="0.01"
            />
          </div>
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
