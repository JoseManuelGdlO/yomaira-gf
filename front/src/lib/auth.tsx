import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  api,
  getToken,
  onUnauthorized,
  setRefresh,
  setToken,
  type AuthUser,
  type LoginResponse,
} from "@/lib/api";
import { clearSession } from "@/lib/auth-guard";

type AuthCtx = {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokenState, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const me = await api.auth.me();
      setUser(me);
    } catch {
      setUser(null);
      clearSession();
      setTokenState(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const t = getToken();
    setTokenState(t);
    if (!t) {
      setReady(true);
      return;
    }
    (async () => {
      try {
        const me = await api.auth.me();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          setUser(null);
          clearSession();
          setTokenState(null);
          if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
            window.location.replace("/login");
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onUnauthorized(() => {
      setUser(null);
      clearSession();
      setTokenState(null);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.replace("/login");
      }
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      clearSession();
      const res = await api.auth.login(email, password);
      setToken(res.accessToken);
      setRefresh(res.refreshToken);
      setTokenState(res.accessToken);
      setUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {}
    clearSession();
    setTokenState(null);
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (perm: string) => {
      if (!user) return false;
      if (user.roles.includes("admin")) return true;
      return user.permissions.includes(perm);
    },
    [user],
  );

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      token: tokenState,
      ready,
      loading,
      login,
      logout,
      refresh,
      hasPermission,
    }),
    [user, tokenState, ready, loading, login, logout, refresh, hasPermission],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
