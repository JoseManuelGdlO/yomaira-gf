import type { Prescription, Patient } from "@/mocks/data";
import { fmtLong } from "@/lib/format";
import { useBranding } from "@/lib/theme/ThemeProvider";

export function PrescriptionPreview({ rx, patient }: { rx: Prescription; patient: Patient }) {
  const { branding } = useBranding();
  return (
    <div className="print-area bg-white text-foreground rounded-2xl border shadow-lg overflow-hidden mx-auto max-w-2xl" style={{ aspectRatio: "8.5 / 11" }}>
      {/* Header band */}
      <div
        className="rx-print-header px-8 py-6 flex items-center justify-between text-white"
        style={{
          background: `linear-gradient(135deg, ${branding.primaryHex}, ${branding.accentHex})`,
        }}
      >
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-white/20 grid place-items-center text-3xl backdrop-blur">
            {branding.logoEmoji}
          </div>
          <div>
            <div className="text-xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>{branding.clinicName}</div>
            <div className="text-sm opacity-90">{branding.specialty}</div>
          </div>
        </div>
        <div className="text-right text-xs opacity-90">
          <div>{branding.address}</div>
          <div>{branding.phone}</div>
          <div>{branding.email}</div>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Doctor */}
        <div className="flex items-baseline justify-between border-b pb-3">
          <div>
            <div className="text-lg font-semibold" style={{ color: `oklch(${branding.primary})` }}>{branding.doctorName}</div>
            <div className="text-xs text-muted-foreground">Cédula profesional: {branding.cedula}</div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            <div className="uppercase tracking-wide">Receta médica</div>
            <div>{fmtLong(rx.date)}</div>
          </div>
        </div>

        {/* Patient */}
        <div className="grid grid-cols-2 gap-4 py-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Paciente</div>
            <div className="font-medium">{patient.name}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Edad</div>
            <div className="font-medium">{patient.age} años</div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-muted-foreground">Diagnóstico</div>
            <div className="font-medium">{rx.diagnosis || "—"}</div>
          </div>
        </div>

        {/* Rx symbol + items */}
        <div className="flex gap-4 mt-2">
          <div className="text-5xl font-display font-bold leading-none" style={{ color: `oklch(${branding.primary})` }}>℞</div>
          <div className="flex-1 space-y-3">
            {rx.items.map((it, i) => (
              <div key={i} className="border-b border-dashed pb-2">
                <div className="font-semibold text-sm">{i + 1}. {it.medication}</div>
                <div className="text-sm text-muted-foreground">
                  Dosis: <span className="text-foreground">{it.dose}</span> · Frecuencia: <span className="text-foreground">{it.frequency}</span> · Duración: <span className="text-foreground">{it.duration}</span>
                </div>
              </div>
            ))}
            {rx.items.length === 0 && <div className="text-sm text-muted-foreground italic">Sin medicamentos.</div>}
          </div>
        </div>

        {rx.indications && (
          <div className="mt-6">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Indicaciones</div>
            <div className="text-sm mt-1 whitespace-pre-wrap">{rx.indications}</div>
          </div>
        )}

        {/* Signature */}
        <div className="mt-12 flex justify-end">
          <div className="text-center">
            <div className="border-t pt-2 px-12 italic font-display text-lg" style={{ color: `oklch(${branding.primary})` }}>{branding.signatureName}</div>
            <div className="text-xs text-muted-foreground">Firma del médico</div>
          </div>
        </div>
      </div>

      <div
        className="rx-print-footer px-8 py-3 text-center text-xs italic"
        style={{ background: branding.secondaryHex, color: branding.accentHex }}
      >
        {branding.rxFooter}
      </div>
    </div>
  );
}
