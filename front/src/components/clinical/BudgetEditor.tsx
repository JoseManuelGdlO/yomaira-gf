import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type BudgetItem } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { getToothTreatmentLabel } from "@/lib/dental";
import { Plus, Trash2, Download, Upload, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
function isAcceptedBudgetFile(file: File) {
  if (file.type === "application/pdf") return true;
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|heic|heif|pdf)$/i.test(file.name);
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function isPdfDataUrl(url: string) {
  return url.startsWith("data:application/pdf");
}

export function BudgetEditor({
  patientId,
  toothTreatments,
  otherTreatments,
  readOnly = false,
  onDirtyChange,
  onRegisterSave,
}: {
  patientId: string;
  toothTreatments?: Record<string, string>;
  otherTreatments?: string[];
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

  const attachmentM = useMutation({
    mutationFn: (body: { attachment: string | null; attachmentFileName?: string | null }) =>
      api.budget.setAttachment(patientId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKey(["budget", patientId], brandingId) });
      toast.success("Archivo de presupuesto guardado");
    },
    onError: () => toast.error("No se pudo guardar el archivo"),
  });

  const attachment = budgetQ.data?.attachment ?? null;
  const attachmentFileName = budgetQ.data?.attachmentFileName ?? null;

  const handleAttachmentFile = (file: File) => {
    if (!isAcceptedBudgetFile(file)) {
      toast.error("Formato no admitido. Usa imagen (JPG, PNG, WEBP) o PDF.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("El archivo no puede superar 10 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      attachmentM.mutate({
        attachment: reader.result as string,
        attachmentFileName: file.name,
      });
    };
    reader.onerror = () => toast.error("No se pudo leer el archivo");
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    attachmentM.mutate({ attachment: null, attachmentFileName: null });
  };

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
    const existingDesc = new Set(items.map((i) => i.description.trim().toLowerCase()).filter(Boolean));
    const existingTeeth = new Set(items.map((i) => i.tooth).filter(Boolean));
    const imported: BudgetItem[] = [];

    if (toothTreatments) {
      for (const [tooth, desc] of Object.entries(toothTreatments)) {
        if (!desc.trim() || existingTeeth.has(tooth)) continue;
        const label = getToothTreatmentLabel(desc);
        if (!label.trim()) continue;
        imported.push({ description: label, tooth, amount: 0 });
      }
    }

    for (const desc of otherTreatments ?? []) {
      const label = getToothTreatmentLabel(desc);
      if (!label.trim() || existingDesc.has(label.trim().toLowerCase())) continue;
      imported.push({ description: label, amount: 0 });
    }

    if (imported.length === 0) {
      toast.info("No hay tratamientos nuevos en el odontograma");
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
        {!readOnly &&
          ((toothTreatments && Object.keys(toothTreatments).length > 0) ||
            (otherTreatments && otherTreatments.some((t) => t.trim()))) && (
          <button
            type="button"
            onClick={importFromChart}
            className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
          >
            <Download className="h-4 w-4" /> Importar desde odontograma
          </button>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-border/80 bg-surface/40 p-4 space-y-3">
        <div>
          <p className="text-sm font-medium">Presupuesto de otra plataforma</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sube una foto o PDF del presupuesto externo para no reescribirlo línea por línea.
          </p>
        </div>
        {attachment ? (
          <div className="space-y-3">
            {attachmentFileName && (
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                {attachmentFileName}
              </p>
            )}
            <div className="border rounded-xl overflow-hidden bg-card">
              {isPdfDataUrl(attachment) ? (
                <iframe
                  title="Presupuesto adjunto"
                  src={attachment}
                  className="w-full h-[min(480px,60vh)] border-0"
                />
              ) : (
                <img
                  src={attachment}
                  alt="Presupuesto adjunto"
                  className="w-full max-h-[480px] object-contain"
                />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent/10"
              >
                <ExternalLink className="h-4 w-4" /> Abrir en pestaña nueva
              </a>
              {!readOnly && (
                <>
                  <label className="inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium cursor-pointer hover:bg-accent/10">
                    <Upload className="h-4 w-4" /> Reemplazar
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      disabled={attachmentM.isPending}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) handleAttachmentFile(f);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={attachmentM.isPending}
                    onClick={removeAttachment}
                    className="inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" /> Quitar archivo
                  </button>
                </>
              )}
            </div>
          </div>
        ) : readOnly ? (
          <p className="text-sm text-muted-foreground">Sin archivo adjunto.</p>
        ) : (
          <label className="border-2 border-dashed rounded-xl p-8 text-center block cursor-pointer hover:bg-surface/60 transition-colors">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <div className="text-sm font-medium">Subir imagen o PDF del presupuesto</div>
            <div className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP o PDF — máx. 10 MB</div>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              disabled={attachmentM.isPending}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) handleAttachmentFile(f);
              }}
            />
          </label>
        )}
        {attachmentM.isPending && (
          <p className="text-xs text-muted-foreground">Guardando archivo…</p>
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
