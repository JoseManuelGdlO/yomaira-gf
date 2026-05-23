import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { ensureAuthenticated } from "@/lib/auth-guard";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => ensureAuthenticated(),
  component: AppShell,
});
