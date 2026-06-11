import { createFileRoute } from "@tanstack/react-router";
import { ensureAnyPermission } from "@/lib/auth-guard";
import { InventoryPageContent } from "@/components/inventory/InventoryPageContent";

export const Route = createFileRoute("/_app/inventario")({
  head: () => ({ meta: [{ title: "Inventario — MediFlow" }] }),
  beforeLoad: () => ensureAnyPermission("inventory.read"),
  component: InventarioPage,
});

function InventarioPage() {
  return <InventoryPageContent />;
}
