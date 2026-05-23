import mediflowLogo from "@/assets/mediflow_logo.png";
import { FAVICON_PATH } from "@/lib/seo";

/** Identidad visual de la plataforma (login y rutas sin sesión). */
export const MEDIFLOW_PLATFORM = {
  name: "MediFlow",
  tagline: "Plataforma médica para consultorios",
  subtitle: "Accede con tu cuenta de doctor o administrador",
  logoSrc: mediflowLogo,
  iconSrc: FAVICON_PATH,
  primary: "0.62 0.14 195",
  secondary: "0.92 0.04 195",
  accent: "0.58 0.18 295",
  surface: "0.985 0.006 195",
  sidebar: "0.99 0.004 195",
  primaryHex: "#14B8A6",
  accentHex: "#7B61C4",
} as const;

export function applyPlatformBrandingToDOM() {
  if (typeof document === "undefined") return;
  const p = MEDIFLOW_PLATFORM;
  const r = document.documentElement.style;
  r.setProperty("--primary", `oklch(${p.primary})`);
  r.setProperty("--ring", `oklch(${p.primary})`);
  r.setProperty("--secondary", `oklch(${p.secondary})`);
  r.setProperty("--accent", `oklch(${p.accent})`);
  r.setProperty("--surface", `oklch(${p.surface})`);
  r.setProperty("--sidebar", `oklch(${p.sidebar})`);
  r.setProperty("--sidebar-primary", `oklch(${p.primary})`);
  r.setProperty("--sidebar-ring", `oklch(${p.primary})`);
  r.setProperty("--chart-1", `oklch(${p.primary})`);
  r.setProperty("--chart-2", `oklch(${p.secondary})`);
  r.setProperty("--chart-3", `oklch(${p.accent})`);
}
