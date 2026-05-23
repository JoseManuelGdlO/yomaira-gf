import { useEffect, useState } from "react";
import {
  DEFAULT_CONSENT_POINTS,
  DEFAULT_CONSENT_TITLE,
  newConsentPointId,
  type ConsentPoint,
} from "@/lib/consent";
import { ChevronDown, ChevronUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function ConsentFormEditor({
  title,
  points,
  onSave,
}: {
  title: string;
  points: ConsentPoint[];
  onSave: (patch: { consentTitle: string; consentPoints: ConsentPoint[] }) => void;
}) {
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftPoints, setDraftPoints] = useState<ConsentPoint[]>(points);

  useEffect(() => {
    setDraftTitle(title);
    setDraftPoints(points);
  }, [title, JSON.stringify(points)]);

  const updatePoint = (id: string, patch: Partial<ConsentPoint>) => {
    setDraftPoints((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const movePoint = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= draftPoints.length) return;
    setDraftPoints((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  };

  const addPoint = () => {
    setDraftPoints((prev) => [...prev, { id: newConsentPointId(), text: "" }]);
  };

  const removePoint = (id: string) => {
    if (draftPoints.length <= 1) {
      toast.error("Debe haber al menos un punto");
      return;
    }
    setDraftPoints((prev) => prev.filter((p) => p.id !== id));
  };

  const save = () => {
    const trimmed = draftPoints.map((p) => ({
      ...p,
      text: p.text.trim(),
      subPoints: p.subPoints?.map((s) => s.trim()).filter(Boolean),
      note: p.note?.trim() || undefined,
    }));
    if (!draftTitle.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    if (trimmed.some((p) => !p.text)) {
      toast.error("Todos los puntos deben tener texto");
      return;
    }
    onSave({ consentTitle: draftTitle.trim(), consentPoints: trimmed });
    toast.success("Carta de consentimiento guardada");
  };

  const resetDefaults = () => {
    setDraftTitle(DEFAULT_CONSENT_TITLE);
    setDraftPoints(DEFAULT_CONSENT_POINTS.map((p) => ({ ...p, subPoints: p.subPoints ? [...p.subPoints] : undefined })));
    toast.message("Plantilla restaurada. Guarda para aplicar los cambios.");
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Título del documento</label>
        <input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Puntos del consentimiento</span>
          <button
            type="button"
            onClick={addPoint}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar punto
          </button>
        </div>

        {draftPoints.map((point, index) => (
          <div key={point.id} className="rounded-xl border bg-surface/50 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Punto {index + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => movePoint(index, -1)}
                  disabled={index === 0}
                  className="p-1.5 rounded-md hover:bg-card disabled:opacity-30"
                  aria-label="Subir"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => movePoint(index, 1)}
                  disabled={index === draftPoints.length - 1}
                  className="p-1.5 rounded-md hover:bg-card disabled:opacity-30"
                  aria-label="Bajar"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removePoint(point.id)}
                  className="p-1.5 rounded-md text-destructive hover:bg-destructive/10"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <textarea
              value={point.text}
              onChange={(e) => updatePoint(point.id, { text: e.target.value })}
              rows={3}
              placeholder="Texto del punto..."
              className="w-full p-3 rounded-lg bg-card border text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!point.italic}
                onChange={(e) => updatePoint(point.id, { italic: e.target.checked })}
                className="rounded border"
              />
              Texto en cursiva
            </label>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Sub-puntos (uno por línea, opcional)
              </label>
              <textarea
                value={(point.subPoints ?? []).join("\n")}
                onChange={(e) =>
                  updatePoint(point.id, {
                    subPoints: e.target.value.split("\n"),
                  })
                }
                rows={3}
                placeholder="Cada línea será una viñeta"
                className="mt-1 w-full p-3 rounded-lg bg-card border text-sm outline-none focus:ring-2 focus:ring-ring resize-y font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Nota al pie del punto (opcional, cursiva)
              </label>
              <textarea
                value={point.note ?? ""}
                onChange={(e) => updatePoint(point.id, { note: e.target.value })}
                rows={2}
                className="mt-1 w-full p-3 rounded-lg bg-card border text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <button
          type="button"
          onClick={save}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Guardar carta
        </button>
        <button
          type="button"
          onClick={resetDefaults}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border bg-card hover:bg-surface"
        >
          <RotateCcw className="h-4 w-4" /> Restaurar plantilla odontopediatría
        </button>
      </div>
    </div>
  );
}
