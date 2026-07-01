import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth-guard";
import { usePlatformTenant } from "@/lib/platformTenant";
import { BRANDINGS, DEFAULT_BRANDING_ID, type Branding } from "@/mocks/brandings";
import { applyPlatformBrandingToDOM } from "@/lib/theme/platformBranding";
import { tenantKey } from "@/lib/tenantQuery";

type ThemeCtx = {
  branding: Branding;
  updateBranding: (patch: Partial<Branding>) => void;
  brandingReady: boolean;
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

const QK_ME_BASE = ["branding", "me"] as const;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { user, ready } = useAuth();
  const { effectiveBrandingId, enteredTenant } = usePlatformTenant();
  const enabled =
    ready &&
    !!user &&
    (!isPlatformAdmin(user) || !!enteredTenant);
  const brandingId = effectiveBrandingId;
  const queryKey = tenantKey(QK_ME_BASE, brandingId);

  const activeQ = useQuery({
    queryKey,
    queryFn: () => api.brandings.me(),
    enabled,
    staleTime: 60_000,
  });

  const brandingReady = !enabled || (!activeQ.isPending && !!activeQ.data);

  const branding: Branding = useMemo(() => {
    if (!enabled) return FALLBACK_BRANDING;
    if (activeQ.data) return activeQ.data;
    return FALLBACK_BRANDING;
  }, [enabled, activeQ.data]);

  useEffect(() => {
    if (enabled && activeQ.data) {
      applyBrandingToDOM(activeQ.data);
    } else if (!enabled) {
      applyPlatformBrandingToDOM();
    }
  }, [enabled, activeQ.data]);

  const updateBranding = (patch: Partial<Branding>) => {
    if (!branding?.id || !brandingId) return;
    const next = { ...branding, ...patch };
    qc.setQueryData(queryKey, next);
    applyBrandingToDOM(next);
    api.brandings
      .update(branding.id, patch)
      .then((updated) => {
        qc.setQueryData(queryKey, updated);
        applyBrandingToDOM(updated);
      })
      .catch(() => {
        void activeQ.refetch();
      });
  };

  return (
    <Ctx.Provider value={{ branding, updateBranding, brandingReady }}>{children}</Ctx.Provider>
  );
}

export function useBranding() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBranding must be used within ThemeProvider");
  return ctx;
}
