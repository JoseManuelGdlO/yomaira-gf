import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type PatientDentalChart, type FranklScale, type DentitionType } from "@/lib/api";
import { ODONTO_QUADRANTS, FRANKL_OPTIONS, DENTITION_OPTIONS } from "@/lib/dental";
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
      <div className="grid lg:grid-cols-2 gap-4">
        {ODONTO_QUADRANTS.map((quad) => (
          <div key={quad.label} className="bg-card border rounded-2xl p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{quad.label}</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="p-1 text-left font-medium">Pieza</th>
                    <th className="p-1 text-left font-medium">Tratamiento</th>
                    <th className="p-1 text-left font-medium">Pieza</th>
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
                          <>
                            <td className="p-1 font-mono font-medium w-10">{pTooth}</td>
                            <td className="p-1">
                              <ToothInput
                                value={local.toothTreatments[pTooth] ?? ""}
                                onChange={(v) => setTooth(pTooth, v)}
                                disabled={readOnly}
                              />
                            </td>
                          </>
                        ) : (
                          <td colSpan={2} />
                        )}
                        {permTooth ? (
                          <>
                            <td className="p-1 font-mono font-medium w-10">{permTooth}</td>
                            <td className="p-1">
                              <ToothInput
                                value={local.toothTreatments[permTooth] ?? ""}
                                onChange={(v) => setTooth(permTooth, v)}
                                disabled={readOnly}
                              />
                            </td>
                          </>
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

function ToothInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder="—"
      className="w-full min-w-[4rem] h-7 px-1.5 rounded border bg-surface text-xs outline-none focus:ring-1 focus:ring-ring disabled:opacity-70"
    />
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
