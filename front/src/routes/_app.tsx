import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { ensureAuthenticated } from "@/lib/auth-guard";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => ensureAuthenticated(),
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const {ready, user} = useAuth();
  
  if (ready && !user) {
    return <Navigate to="/login" />;
  }

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>;
  }

  return <AppShell />;
}