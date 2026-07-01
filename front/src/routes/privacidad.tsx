import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { MediFlowLogo } from "@/components/app/MediFlowLogo";
import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";
import { MEDIFLOW_PLATFORM } from "@/lib/theme/platformBranding";

const search = z.object({
  from: z.enum(["login", "dashboard"]).optional(),
});

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [{ title: `Política de privacidad — ${MEDIFLOW_PLATFORM.name}` }],
  }),
  validateSearch: (s) => search.parse(s),
  component: PrivacidadPage,
});

function PrivacidadPage() {
  const { from } = Route.useSearch();
  const backTo = from === "dashboard" ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-8 lg:py-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <MediFlowLogo imgClassName="max-w-[160px]" />
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>

        <div className="bg-card rounded-2xl border p-6 lg:p-10">
          <PrivacyPolicyContent />
        </div>
      </div>
    </div>
  );
}
