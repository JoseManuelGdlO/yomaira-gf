import { useState } from "react";
import { fmtShort } from "@/lib/format";
import { formatConsultationPaymentColumn } from "@/lib/finance";
import type { Consultation } from "@/mocks/data";
import { EvolutionEntryDialog } from "./EvolutionEntryDialog";
import { Pencil, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";

function formatUsages(c: Consultation): string {
  const usages = c.inventoryUsages;
  if (!usages?.length) return "—";
  return usages.map((u) => `${u.itemName ?? "Insumo"} (${u.quantity}${u.unit ? ` ${u.unit}` : ""})`).join(", ");
}

export function EvolutionTable({
  patientId,
  consultations,
  readOnly = false,
}: {
  patientId: string;
  consultations: Consultation[];
  readOnly?: boolean;
}) {
  const { hasPermission } = useAuth();
  const showInventory = hasPermission("inventory.read");
  const [editRow, setEditRow] = useState<Consultation | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const sorted = [...consultations].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="p-4 border-b flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-display text-lg font-semibold">Notas de evolución</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Registro por visita — puedes añadir filas aquí sin usar la agenda
            </p>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:bg-primary/90 shrink-0"
            >
              <Plus className="h-4 w-4" /> Nuevo registro
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-surface/80 text-left text-muted-foreground border-b">
                <th className="p-3 font-medium w-24">Fecha</th>
                <th className="p-3 font-medium">Tratamiento realizado</th>
                <th className="p-3 font-medium">Próximo tratamiento</th>
                <th className="p-3 font-medium">Pago y próxima cita</th>
                <th className="p-3 font-medium">Nota de evolución</th>
                {showInventory && <th className="p-3 font-medium">Insumos</th>}
                {!readOnly && <th className="p-3 w-10" />}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={(readOnly ? 5 : 6) + (showInventory ? 1 : 0)} className="p-8 text-center text-muted-foreground">
                    Sin registros. Usa &quot;Nuevo registro&quot; para añadir la primera fila a la hoja clínica.
                  </td>
                </tr>
              ) : (
                sorted.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-surface/40 align-top">
                    <td className="p-3 whitespace-nowrap text-muted-foreground">{fmtShort(c.date)}</td>
                    <td className="p-3">{c.treatment || "—"}</td>
                    <td className="p-3">{c.nextTreatment || "—"}</td>
                    <td className="p-3">{formatConsultationPaymentColumn(c)}</td>
                    <td className="p-3 whitespace-pre-wrap">{c.evolutionNote || c.notes || "—"}</td>
                    {showInventory && (
                      <td className="p-3 text-xs text-muted-foreground">{formatUsages(c)}</td>
                    )}
                    {!readOnly && (
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => setEditRow(c)}
                          className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EvolutionEntryDialog
        mode="create"
        patientId={patientId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <EvolutionEntryDialog
        mode="edit"
        consultation={editRow}
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
      />
    </>
  );
}
