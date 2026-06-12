import { createFileRoute } from "@tanstack/react-router";
import { ensureAnyPermission } from "@/lib/auth-guard";
import { FinancePageContent } from "@/components/finance/FinancePageContent";

export const Route = createFileRoute("/_app/finanzas")({
  head: () => ({ meta: [{ title: "Finanzas — MediFlow" }] }),
  beforeLoad: () => ensureAnyPermission("finances.read"),
  component: FinanzasPage,
});

function FinanzasPage() {
  return <FinancePageContent />;
}
