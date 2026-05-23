import { redirect } from "@tanstack/react-router";
import { api, getToken, setRefresh, setToken } from "@/lib/api";

/** Quita credenciales guardadas en el navegador. */
export function clearSession(): void {
  setToken(null);
  setRefresh(null);
}

/**
 * Rutas protegidas: exige sesión válida (token + /auth/me).
 * Si solo hay un token viejo o inválido, lo borra y manda a /login.
 */
export async function ensureAuthenticated(): Promise<void> {
  if (typeof window === "undefined") {
    throw redirect({ to: "/login" });
  }

  const token = getToken();
  if (!token) {
    throw redirect({ to: "/login" });
  }

  try {
    await api.auth.me();
  } catch {
    clearSession();
    throw redirect({ to: "/login" });
  }
}

/** Exige al menos uno de los permisos indicados (admin siempre pasa). */
export async function ensureAnyPermission(...perms: string[]): Promise<void> {
  if (typeof window === "undefined") {
    throw redirect({ to: "/login" });
  }

  const token = getToken();
  if (!token) {
    throw redirect({ to: "/login" });
  }

  try {
    const user = await api.auth.me();
    if (user.roles.includes("admin")) return;
    if (perms.some((p) => user.permissions.includes(p))) return;
  } catch {
    clearSession();
    throw redirect({ to: "/login" });
  }

  throw redirect({ to: "/dashboard" });
}

/**
 * Ruta /login: si ya hay sesión válida, manda al dashboard.
 */
export async function redirectIfAuthenticated(): Promise<void> {
  if (typeof window === "undefined") return;

  const token = getToken();
  if (!token) return;

  try {
    await api.auth.me();
    throw redirect({ to: "/dashboard" });
  } catch {
    clearSession();
  }
}
