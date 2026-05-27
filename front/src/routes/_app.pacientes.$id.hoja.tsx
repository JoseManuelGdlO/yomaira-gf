import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { PrintClinicalSheet } from "@/components/clinical/PrintClinicalSheet";
import { Printer, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/pacientes/$id/hoja")({
  head: () => ({ meta: [{ title: "Imprimir hoja clínica — MediFlow" }] }),
  component: PrintHojaPage,
});

function PrintHojaPage() {
  const { id } = Route.useParams();
  const { patients, consultations } = useStore();
  const { branding } = useBranding();
  const patient = patients.find((p) => p.id === id);
  if (!patient) throw notFound();

  const patientConsults = consultations.filter((c) => c.patientId === id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden flex-wrap gap-2">
        <Link
          to="/pacientes/$id"
          params={{ id }}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al expediente
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/90"
        >
          <Printer className="h-4 w-4" /> Imprimir
        </button>
      </div>

      <PrintClinicalSheet branding={branding} patient={patient} consultations={patientConsults} />

      <style>{`
        @media print {
          aside, header.h-16, .print\\:hidden { display: none !important; }
          main { padding: 0 !important; max-width: none !important; }
          .print-clinical-sheet { padding: 12mm !important; }
        }
      `}</style>
    </div>
  );
}
