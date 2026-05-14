import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BRANDINGS, DEFAULT_BRANDING_ID, type Branding } from "@/mocks/brandings";

type ThemeCtx = {
  branding: Branding;
  setBrandingId: (id: string) => void;
  updateBranding: (patch: Partial<Branding>) => void;
  allBrandings: Branding[];
};

const Ctx = createContext<ThemeCtx | null>(null);

const STORAGE_KEY = "med:branding-id";
const OVERRIDE_KEY = "med:branding-overrides";

function applyBrandingToDOM(b: Branding) {
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [brandingId, setBrandingIdState] = useState<string>(DEFAULT_BRANDING_ID);
  const [overrides, setOverrides] = useState<Record<string, Partial<Branding>>>({});

  useEffect(() => {
    try {
      const id = localStorage.getItem(STORAGE_KEY);
      if (id) setBrandingIdState(id);
      const ov = localStorage.getItem(OVERRIDE_KEY);
      if (ov) setOverrides(JSON.parse(ov));
    } catch {}
  }, []);

  const branding = useMemo(() => {
    const base = BRANDINGS.find((b) => b.id === brandingId) ?? BRANDINGS[0];
    return { ...base, ...(overrides[base.id] ?? {}) } as Branding;
  }, [brandingId, overrides]);

  useEffect(() => {
    applyBrandingToDOM(branding);
  }, [branding]);

  const setBrandingId = (id: string) => {
    setBrandingIdState(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  };

  const updateBranding = (patch: Partial<Branding>) => {
    setOverrides((prev) => {
      const next = { ...prev, [branding.id]: { ...(prev[branding.id] ?? {}), ...patch } };
      try { localStorage.setItem(OVERRIDE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <Ctx.Provider value={{ branding, setBrandingId, updateBranding, allBrandings: BRANDINGS }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBranding() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBranding must be used within ThemeProvider");
  return ctx;
}
