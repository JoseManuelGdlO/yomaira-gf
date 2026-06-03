import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmtShort } from "@/lib/format";
import { ODONTO_QUADRANTS, FRANKL_OPTIONS, DENTITION_OPTIONS, ODONTO_DONE_COLOR, getToothTreatmentColor, getToothTreatmentLabel, isToothTreatmentDone } from "@/lib/dental";
import type { Branding } from "@/mocks/brandings";
import type { Patient, Consultation } from "@/mocks/data";

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export function PrintClinicalSheet({
  branding,
  patient,
  consultations,
}: {
  branding: Branding;
  patient: Patient;
  consultations: Consultation[];
}) {
  const chartQ = useQuery({
    queryKey: ["dental-chart", patient.id],
    queryFn: () => api.dentalChart.get(patient.id),
  });
  const budgetQ = useQuery({
    queryKey: ["budget", patient.id],
    queryFn: () => api.budget.get(patient.id),
  });

  const chart = chartQ.data;
  const budget = budgetQ.data;
  const sortedConsults = [...consultations].sort((a, b) => a.date.localeCompare(b.date));
  const franklLabel = FRANKL_OPTIONS.find((o) => o.value === chart?.frankl)?.label ?? "—";

  return (
    <div className="print-clinical-sheet bg-white text-black max-w-[210mm] mx-auto p-8 text-sm leading-snug">
      <header className="text-center border-b-2 border-black pb-4 mb-6">
        <div className="text-2xl font-semibold">{branding.clinicName}</div>
        <div className="text-base mt-1">{branding.doctorName}</div>
        <div className="text-xs mt-1 text-gray-700">{branding.specialty}</div>
        <div className="text-xs mt-2 font-medium">Hoja clínica — {patient.name}</div>
      </header>

      <section className="mb-6 break-inside-avoid">
        <h2 className="font-bold text-base uppercase border-b border-black mb-3">Odontograma</h2>
        <p className="text-[9px] mb-3 inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 border border-gray-400"
            style={{ backgroundColor: `${ODONTO_DONE_COLOR}44` }}
          />
          Rojo = pieza ya tratada. Sin rojo = tratamiento planificado.
        </p>
        <div className="grid grid-cols-2 gap-3 text-[10px]">
          {ODONTO_QUADRANTS.map((quad) => (
            <div key={quad.label} className="border border-gray-400 p-2">
              <div className="font-semibold mb-1">{quad.label}</div>
              <table className="w-full">
                <tbody>
                  {Array.from({ length: Math.max(quad.primary.length, quad.permanent.length) }).map((_, i) => {
                    const p = quad.primary[i];
                    const perm = quad.permanent[i];
                    return (
                      <tr key={i}>
                        {p && (
                          <>
                            <PrintToothCell tooth={p} treatment={chart?.toothTreatments?.[p]} />
                          </>
                        )}
                        {perm && (
                          <>
                            <PrintToothCell tooth={perm} treatment={chart?.toothTreatments?.[perm]} className="pl-1" />
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div><strong>Frankl:</strong> {franklLabel}</div>
          <div>
            <strong>Dentición:</strong>{" "}
            {DENTITION_OPTIONS.filter((d) => chart?.dentition?.includes(d.value as never))
              .map((d) => d.label)
              .join(", ") || "—"}
          </div>
          <div><strong>ATM:</strong> {chart?.atm || "—"}</div>
          <div><strong>Ganglios:</strong> {chart?.ganglios || "—"}</div>
          <div><strong>Tejidos blandos:</strong> {chart?.softTissues || "—"}</div>
          <div><strong>Frenillos:</strong> {chart?.frenula || "—"}</div>
        </div>
      </section>

      <section className="mb-6 break-inside-avoid">
        <h2 className="font-bold text-base uppercase border-b border-black mb-3">Presupuesto</h2>
        {(budget?.items?.length ?? 0) === 0 ? (
          <p className="text-gray-600">Sin líneas de presupuesto.</p>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left py-1">Tratamiento</th>
                <th className="text-left py-1 w-14">Pieza</th>
                <th className="text-right py-1 w-24">Importe</th>
              </tr>
            </thead>
            <tbody>
              {budget!.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-300">
                  <td className="py-1">{item.description}</td>
                  <td className="py-1">{item.tooth ?? ""}</td>
                  <td className="py-1 text-right">{formatMoney(item.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="py-2 text-right font-bold">Total</td>
                <td className="py-2 text-right font-bold">{formatMoney(budget!.total)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      <section>
        <h2 className="font-bold text-base uppercase border-b border-black mb-3">Evolución</h2>
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left p-1 w-16">Fecha</th>
              <th className="text-left p-1">Trat. realizado</th>
              <th className="text-left p-1">Próximo trat.</th>
              <th className="text-left p-1">Pago y próx. cita</th>
              <th className="text-left p-1">Nota evolución</th>
            </tr>
          </thead>
          <tbody>
            {sortedConsults.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Sin registros
                </td>
              </tr>
            ) : (
              sortedConsults.map((c) => (
                <tr key={c.id} className="border-b border-gray-300 align-top break-inside-avoid">
                  <td className="p-1">{fmtShort(c.date)}</td>
                  <td className="p-1">{c.treatment}</td>
                  <td className="p-1">{c.nextTreatment || ""}</td>
                  <td className="p-1">{c.paymentAndNextAppointment || ""}</td>
                  <td className="p-1 whitespace-pre-wrap">{c.evolutionNote || c.notes || ""}</td>
                </tr>
              ))
            )}
            {/* Empty rows like printed form page 4 */}
            {Array.from({ length: Math.max(0, 8 - sortedConsults.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="border-b border-gray-200 h-8">
                <td className="p-1" />
                <td className="p-1" />
                <td className="p-1" />
                <td className="p-1" />
                <td className="p-1" />
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function PrintToothCell({
  tooth,
  treatment,
  className = "",
}: {
  tooth: string;
  treatment?: string;
  className?: string;
}) {
  const done = isToothTreatmentDone(treatment);
  const color = getToothTreatmentColor(treatment);
  const label = getToothTreatmentLabel(treatment);
  const cellStyle = done && color ? { backgroundColor: `${color}33` } : undefined;

  return (
    <>
      <td className={`font-mono w-6 ${className} ${done ? "text-red-700 font-semibold" : ""}`} style={cellStyle}>
        {tooth}
      </td>
      <td className={`pr-1 ${className} ${done ? "" : "text-gray-600 italic"}`} style={cellStyle}>
        {label}
      </td>
    </>
  );
}
