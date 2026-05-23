import type { Patient } from "@/mocks/data";
import { getConsentContent } from "@/lib/consent";
import type { Branding } from "@/mocks/brandings";

export function ConsentDocument({
  branding,
  patient,
}: {
  branding: Pick<Branding, "consentTitle" | "consentPoints" | "doctorName" | "specialty" | "cedula" | "logoEmoji">;
  patient?: Patient | null;
}) {
  const { title, points } = getConsentContent(branding);

  return (
    <article className="print-area bg-card border rounded-2xl p-8 lg:p-12 max-w-3xl mx-auto print:border-0 print:shadow-none print:p-0">
      <header className="flex items-start gap-4 border-b pb-6 mb-6">
        <div className="h-14 w-14 rounded-xl bg-primary text-primary-foreground grid place-items-center text-2xl">
          {branding.logoEmoji}
        </div>
        <div>
          <div className="font-display text-xl font-semibold">{branding.doctorName}</div>
          <div className="text-sm text-muted-foreground">{branding.specialty}</div>
          <div className="text-xs text-muted-foreground mt-1">Cédula {branding.cedula}</div>
        </div>
      </header>

      <h1 className="font-display text-2xl font-semibold mb-4">{title}</h1>

      {patient && (
        <div className="text-sm bg-surface rounded-lg p-3 mb-6 border">
          <span className="text-muted-foreground">Paciente:</span>{" "}
          <span className="font-medium">{patient.name}</span>
          <span className="mx-2 text-muted-foreground">·</span>
          <span className="text-muted-foreground">Tutor:</span>{" "}
          <span className="font-medium">{patient.guardian}</span>
        </div>
      )}

      <ol className="space-y-3 text-sm leading-relaxed list-decimal pl-5">
        {points.map((point) => (
          <li key={point.id} className={point.italic ? "italic" : undefined}>
            {point.text}
            {point.subPoints && point.subPoints.length > 0 && (
              <ul className="list-disc pl-5 mt-1 space-y-0.5 not-italic">
                {point.subPoints.map((sub, i) => (
                  <li key={i}>{sub}</li>
                ))}
              </ul>
            )}
            {point.note && <p className="mt-1 italic">{point.note}</p>}
          </li>
        ))}
      </ol>

      <div className="mt-12 pt-6 border-t">
        <div className="text-sm text-muted-foreground mb-1">
          Nombre y firma del padre, madre o tutor:
        </div>
        <div className="h-16 border-b border-foreground/40" />
        <div className="mt-6 text-sm text-muted-foreground">Fecha: ____ / ____ / ________</div>
      </div>
    </article>
  );
}
