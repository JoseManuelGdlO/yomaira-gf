import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BRANDINGS, DEFAULT_BRANDING_ID, type Branding } from "@/mocks/brandings";

type ThemeCtx = {
  branding: Branding;
  updateBranding: (patch: Partial<Branding>) => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

function applyBrandingToDOM(b: Branding) {
  if (typeof document === "undefined") return;
  const r = document.documentElement.style;
  r.setProperty("--primary", `oklch(${b.primary})`);
  r.setProperty("--ring", `oklch(${b.primary})`);
  r.setProperty("--secondary", `oklch(${b.secondary})`);
  r.setProperty("--accent", `oklch(${b.accent})`);
  r.setProperty("--surface", `oklch(${b.surface})`);
  r.setProperty("--sidebar", `oklch(${b.sidebar})`);
  r.setProperty("--sidebar-primary", `oklch(${b.primary})`);
  r.setProperty("--sidebar-ring", `oklch(${b.primary})`);
  r.setProperty("--chart-1", `oklch(${b.primary})`);
  r.setProperty("--chart-2", `oklch(${b.secondary})`);
  r.setProperty("--chart-3", `oklch(${b.accent})`);
}

const FALLBACK_BRANDING: Branding =
  BRANDINGS.find((b) => b.id === DEFAULT_BRANDING_ID) ?? BRANDINGS[0];

const QK_ACTIVE = ["branding", "active"] as const;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const enabled = ready && !!user;

  const activeQ = useQuery({
    queryKey: QK_ACTIVE,
    queryFn: () => api.brandings.active(),
    enabled,
    staleTime: 60_000,
  });

  const branding: Branding = useMemo(() => {
    if (activeQ.data) return activeQ.data;
    return FALLBACK_BRANDING;
  }, [activeQ.data]);

  useEffect(() => {
    applyBrandingToDOM(branding);
  }, [branding]);

  const updateBranding = (patch: Partial<Branding>) => {
    if (!branding?.id) return;
    api.brandings
      .update(branding.id, patch)
      .then(() => activeQ.refetch())
      .catch(() => activeQ.refetch());
  };

  return (
    <Ctx.Provider value={{ branding, updateBranding }}>{children}</Ctx.Provider>
  );
}

export function useBranding() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBranding must be used within ThemeProvider");
  return ctx;
}
