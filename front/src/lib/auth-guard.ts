import { redirect } from "@tanstack/react-router";
import { api, getToken, setRefresh, setToken, type AuthUser } from "@/lib/api";

/** Quita credenciales guardadas en el navegador. */
export function clearSession(): void {
  setToken(null);
  setRefresh(null);
}

export function isPlatformAdmin(user: AuthUser): boolean {
  return user.roles.includes("platform_admin");
}

export function homeRouteForUser(user: AuthUser): "/consultorios" | "/dashboard" {
  return isPlatformAdmin(user) ? "/consultorios" : "/dashboard";
}

/**
 * Rutas protegidas: exige sesión válida (token + /auth/me).
 * Si solo hay un token viejo o inválido, lo borra y manda a /login.
 */
export async function ensureAuthenticated(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const token = getToken();
  if (!token) {
    throw redirect({ to: "/login" });
  }

  try {
    const user = await api.auth.me();
    if (isPlatformAdmin(user) && !window.location.pathname.startsWith("/consultorios")) {
      throw redirect({ to: "/consultorios" });
    }
  } catch (err) {
    if (err && typeof err === "object" && "to" in err) throw err;
    clearSession();
    throw redirect({ to: "/login" });
  }
}

/** Exige al menos uno de los permisos indicados (admin siempre pasa). */
export async function ensureAnyPermission(...perms: string[]): Promise<void> {
  if (typeof window === "undefined") {
    return;
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

/** Exige uno de los roles indicados. */
export async function ensureRole(...roles: string[]): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const token = getToken();
  if (!token) {
    throw redirect({ to: "/login" });
  }

  try {
    const user = await api.auth.me();
    if (roles.some((r) => user.roles.includes(r))) return;
    throw redirect({ to: homeRouteForUser(user) });
  } catch (err) {
    if (err && typeof err === "object" && "to" in err) throw err;
    clearSession();
    throw redirect({ to: "/login" });
  }
}

/**
 * Ruta /login: si ya hay sesión válida, manda al home según rol.
 */
export async function redirectIfAuthenticated(): Promise<void> {
  if (typeof window === "undefined") return;

  const token = getToken();
  if (!token) return;

  try {
    const user = await api.auth.me();
    throw redirect({ to: homeRouteForUser(user) });
  } catch (err) {
    if (err && typeof err === "object" && "to" in err) throw err;
    clearSession();
  }
}
