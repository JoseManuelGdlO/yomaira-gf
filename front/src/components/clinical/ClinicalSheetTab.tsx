import { Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import type { Consultation } from "@/mocks/data";
import { Odontogram } from "./Odontogram";
import { BudgetEditor } from "./BudgetEditor";
import { EvolutionTable } from "./EvolutionTable";

export function ClinicalSheetTab({
  patientId,
  consultations,
}: {
  patientId: string;
  consultations: Consultation[];
}) {
  const { user } = useAuth();
  const chartQ = useQuery({
    queryKey: tenantKey(["dental-chart", patientId], user?.brandingId),
    queryFn: () => api.dentalChart.get(patientId),
    enabled: !!patientId,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-semibold">Hoja clínica</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Odontograma, presupuesto y evolución — equivalente a las páginas 3 y 4 de la historia clínica impresa.
          </p>
        </div>
        <Link
          to="/pacientes/$id/hoja"
          params={{ id: patientId }}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/90 shrink-0"
        >
          <Printer className="h-4 w-4" /> Imprimir hoja
        </Link>
      </div>

      <section>
        <Odontogram patientId={patientId} />
      </section>

      <section>
        <BudgetEditor
          patientId={patientId}
          toothTreatments={chartQ.data?.toothTreatments}
        />
      </section>

      <section>
        <EvolutionTable patientId={patientId} consultations={consultations} />
      </section>
    </div>
  );
}
