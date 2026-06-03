import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type PatientDentalChart, type FranklScale, type DentitionType } from "@/lib/api";
import {
  ODONTO_QUADRANTS,
  FRANKL_OPTIONS,
  DENTITION_OPTIONS,
  ODONTO_CUSTOM_COLOR,
  ODONTO_TREATMENT_OPTIONS,
  getToothTreatmentColor,
  getToothTreatmentLabel,
  getToothTreatmentStatusCode,
  getToothTreatmentText,
  toothTreatmentStorageValue,
} from "@/lib/dental";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { toast } from "sonner";

const defaultChart: Omit<PatientDentalChart, "id" | "patientId"> = {
  toothTreatments: {},
  frankl: "na",
  dentition: [],
  atm: "",
  ganglios: "",
  softTissues: "",
  frenula: "",
};

function chartFromData(data: PatientDentalChart): typeof defaultChart {
  return {
    toothTreatments: data.toothTreatments ?? {},
    frankl: data.frankl ?? "na",
    dentition: data.dentition ?? [],
    atm: data.atm ?? "",
    ganglios: data.ganglios ?? "",
    softTissues: data.softTissues ?? "",
    frenula: data.frenula ?? "",
  };
}

export function Odontogram({
  patientId,
  readOnly = false,
  onDirtyChange,
  onRegisterSave,
}: {
  patientId: string;
  readOnly?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onRegisterSave?: (save: () => Promise<unknown>) => void;
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const brandingId = user?.brandingId;
  const [local, setLocal] = useState(defaultChart);
  const [dirty, setDirty] = useState(false);

  const chartQ = useQuery({
    queryKey: tenantKey(["dental-chart", patientId], brandingId),
    queryFn: () => api.dentalChart.get(patientId),
    enabled: !!patientId,
  });

  useEffect(() => {
    setDirty(false);
    onDirtyChange?.(false);
  }, [patientId, onDirtyChange]);

  useEffect(() => {
    if (chartQ.data && !dirty) {
      setLocal(chartFromData(chartQ.data));
    }
  }, [chartQ.data, dirty]);

  const saveM = useMutation({
    mutationFn: (body: Partial<PatientDentalChart>) => api.dentalChart.upsert(patientId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKey(["dental-chart", patientId], brandingId) });
      setDirty(false);
      onDirtyChange?.(false);
      toast.success("Odontograma guardado");
    },
    onError: () => toast.error("No se pudo guardar el odontograma"),
  });

  useEffect(() => {
    if (readOnly) return;
    onRegisterSave?.(() => saveM.mutateAsync(local));
  }, [local, readOnly, onRegisterSave, saveM]);

  const markDirty = () => {
    if (!dirty) {
      setDirty(true);
      onDirtyChange?.(true);
    }
  };

  const update = (patch: Partial<typeof local>) => {
    if (readOnly) return;
    setLocal((prev) => ({ ...prev, ...patch }));
    markDirty();
  };

  const setTooth = (tooth: string, treatment: string) => {
    const toothTreatments = { ...local.toothTreatments };
    if (treatment.trim()) toothTreatments[tooth] = treatment.trim();
    else delete toothTreatments[tooth];
    update({ toothTreatments });
  };

  const toggleDentition = (d: DentitionType) => {
    const dentition = local.dentition.includes(d)
      ? local.dentition.filter((x) => x !== d)
      : [...local.dentition, d];
    update({ dentition });
  };

  if (chartQ.isLoading) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Cargando odontograma…</div>;
  }

  return (
    <div className="space-y-6">
      <OdontogramLegend />

      <div className="grid lg:grid-cols-2 gap-4">
        {ODONTO_QUADRANTS.map((quad) => (
          <div key={quad.label} className="bg-card border rounded-2xl p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{quad.label}</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="p-1 text-left font-medium w-10">Pieza</th>
                    <th className="p-1 text-left font-medium">Tratamiento</th>
                    <th className="p-1 text-left font-medium w-10">Pieza</th>
                    <th className="p-1 text-left font-medium">Tratamiento</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(quad.primary.length, quad.permanent.length) }).map((_, i) => {
                    const pTooth = quad.primary[i];
                    const permTooth = quad.permanent[i];
                    return (
                      <tr key={i} className="border-t border-border/60">
                        {pTooth ? (
                          <ToothCells
                            tooth={pTooth}
                            value={local.toothTreatments[pTooth] ?? ""}
                            onChange={(v) => setTooth(pTooth, v)}
                            readOnly={readOnly}
                          />
                        ) : (
                          <td colSpan={2} />
                        )}
                        {permTooth ? (
                          <ToothCells
                            tooth={permTooth}
                            value={local.toothTreatments[permTooth] ?? ""}
                            onChange={(v) => setTooth(permTooth, v)}
                            readOnly={readOnly}
                          />
                        ) : (
                          <td colSpan={2} />
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border rounded-2xl p-6 space-y-4">
        <div className="font-display font-semibold">Examen clínico</div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">Frankl</label>
          <div className="flex flex-wrap gap-2">
            {FRANKL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={readOnly}
                onClick={() => update({ frankl: opt.value as FranklScale })}
                className={`px-3 h-9 rounded-lg border text-sm font-medium transition-colors ${
                  local.frankl === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface hover:bg-accent/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">Dentición</label>
          <div className="flex flex-wrap gap-2">
            {DENTITION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={readOnly}
                onClick={() => toggleDentition(opt.value as DentitionType)}
                className={`px-3 h-9 rounded-lg border text-sm transition-colors ${
                  local.dentition.includes(opt.value as DentitionType)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface hover:bg-accent/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {(
            [
              ["ATM", "atm"],
              ["Ganglios", "ganglios"],
              ["Tejidos blandos", "softTissues"],
              ["Frenillos", "frenula"],
            ] as const
          ).map(([label, key]) => (
            <div key={key}>
              <label className="text-xs font-medium text-muted-foreground">{label}</label>
              <textarea
                value={local[key]}
                disabled={readOnly}
                onChange={(e) => update({ [key]: e.target.value })}
                rows={2}
                className="mt-1 w-full p-2 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring resize-y disabled:opacity-70"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OdontogramLegend() {
  return (
    <div className="bg-card border rounded-2xl p-4">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Leyenda de tratamientos
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {ODONTO_TREATMENT_OPTIONS.map((opt) => (
          <div key={opt.value} className="inline-flex items-center gap-2 text-xs">
            <span
              className="h-3.5 w-3.5 rounded-sm shrink-0 border border-black/10"
              style={{ backgroundColor: opt.color }}
              aria-hidden
            />
            <span>{opt.label}</span>
          </div>
        ))}
        <div className="inline-flex items-center gap-2 text-xs">
          <span
            className="h-3.5 w-3.5 rounded-sm shrink-0 border border-black/10"
            style={{ backgroundColor: ODONTO_CUSTOM_COLOR }}
            aria-hidden
          />
          <span>Otro / texto libre</span>
        </div>
      </div>
    </div>
  );
}

function ToothCells({
  tooth,
  value,
  onChange,
  readOnly,
}: {
  tooth: string;
  value: string;
  onChange: (v: string) => void;
  readOnly: boolean;
}) {
  const color = getToothTreatmentColor(value);
  const cellStyle = color ? { backgroundColor: `${color}22` } : undefined;

  return (
    <>
      <td className="p-1 font-mono font-medium w-10 align-middle" style={cellStyle}>
        <div className="flex items-center gap-1.5">
          {color && (
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0 border border-black/10"
              style={{ backgroundColor: color }}
              title={getToothTreatmentLabel(value)}
              aria-hidden
            />
          )}
          {tooth}
        </div>
      </td>
      <td className="p-1 align-middle" style={cellStyle}>
        <ToothTreatmentField value={value} onChange={onChange} readOnly={readOnly} />
      </td>
    </>
  );
}

function ToothTreatmentField({
  value,
  onChange,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly: boolean;
}) {
  const statusCode = getToothTreatmentStatusCode(value);
  const text = getToothTreatmentText(value);
  const color = getToothTreatmentColor(value);

  if (readOnly) {
    if (!value.trim()) return <span className="text-muted-foreground">—</span>;
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border border-black/5"
        style={{ backgroundColor: color ? `${color}33` : undefined }}
      >
        {color && (
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden />
        )}
        {getToothTreatmentLabel(value)}
      </span>
    );
  }

  const persist = (nextStatus: typeof statusCode, nextText: string) => {
    if (nextStatus === "none" && !nextText.trim()) {
      onChange("");
      return;
    }
    const code = nextStatus === "none" ? "otro" : nextStatus;
    onChange(toothTreatmentStorageValue(code, nextText));
  };

  return (
    <div className="flex items-center gap-1 min-w-0">
      <Select
        value={statusCode}
        onValueChange={(next) => {
          if (next === "none") persist("none", text);
          else persist(next as typeof statusCode, text);
        }}
      >
        <SelectTrigger
          className="h-7 w-9 shrink-0 px-1.5 bg-surface"
          aria-label="Color de estatus"
          title="Color de estatus"
        >
          <span
            className="mx-auto h-3 w-3 rounded-full border border-black/10"
            style={{ backgroundColor: color ?? "transparent" }}
            aria-hidden
          />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="none">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm shrink-0 border border-dashed border-muted-foreground/40" aria-hidden />
              Sin estatus
            </span>
          </SelectItem>
          {ODONTO_TREATMENT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-sm shrink-0 border border-black/10"
                  style={{ backgroundColor: opt.color }}
                  aria-hidden
                />
                {opt.label}
              </span>
            </SelectItem>
          ))}
          <SelectItem value="otro">
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0 border border-black/10"
                style={{ backgroundColor: ODONTO_CUSTOM_COLOR }}
                aria-hidden
              />
              Otro / texto libre
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      <input
        value={text}
        onChange={(e) => persist(statusCode === "none" ? "otro" : statusCode, e.target.value)}
        placeholder="Estatus o tratamiento"
        className="w-full min-w-0 h-7 px-1.5 rounded border bg-surface text-xs outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

/** Read-only chart data for print */
export function useDentalChart(patientId: string) {
  return useQuery({
    queryKey: ["dental-chart", patientId],
    queryFn: () => api.dentalChart.get(patientId),
    enabled: !!patientId,
  });
}
