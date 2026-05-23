import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { ConsentDocument } from "@/components/consent/ConsentDocument";
import { Printer, ArrowLeft, Settings2 } from "lucide-react";
import { z } from "zod";

const search = z.object({ patientId: z.string().optional() });

export const Route = createFileRoute("/_app/consentimiento")({
  head: () => ({ meta: [{ title: "Consentimiento informado — MedFlow" }] }),
  validateSearch: (s) => search.parse(s),
  component: ConsentPage,
});

function ConsentPage() {
  const { patientId } = Route.useSearch();
  const { patients } = useStore();
  const { branding } = useBranding();
  const patient = patientId ? patients.find((p) => p.id === patientId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden flex-wrap gap-2">
        <Link
          to="/pacientes"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/branding"
            hash="consentimiento"
            className="inline-flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-surface"
          >
            <Settings2 className="h-4 w-4" /> Editar plantilla
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/90"
          >
            <Printer className="h-4 w-4" /> Imprimir
          </button>
        </div>
      </div>

      <ConsentDocument branding={branding} patient={patient} />

      <style>{`@media print { aside, header.h-16 { display: none !important; } main { padding: 0 !important; max-width: none !important; } }`}</style>
    </div>
  );
}
