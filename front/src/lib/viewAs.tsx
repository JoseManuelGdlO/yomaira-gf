import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserDTO } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth-guard";
import { userHasPermission } from "@/lib/userPermissions";
import { usePlatformTenant } from "@/lib/platformTenant";

const STORAGE_KEY = "med:view-as-user-id";

type ViewAsCtx = {
  viewingAs: UserDTO | null;
  setViewingAs: (user: UserDTO | null) => void;
  effectiveHasPermission: (perm: string) => boolean;
  effectiveUser: UserDTO | null;
};

const Ctx = createContext<ViewAsCtx | null>(null);

function readStoredUserId(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredUserId(id: string | null): void {
  try {
    if (id) sessionStorage.setItem(STORAGE_KEY, id);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function ViewAsProvider({ children }: { children: ReactNode }) {
  const { user, ready, hasPermission } = useAuth();
  const { enteredTenant } = usePlatformTenant();
  const [viewingAs, setViewingAsState] = useState<UserDTO | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(() => readStoredUserId());

  const canUseViewAs = !!(user && isPlatformAdmin(user) && enteredTenant);

  useEffect(() => {
    if (!ready) return;
    if (!canUseViewAs) {
      setViewingAsState(null);
      writeStoredUserId(null);
      setPendingUserId(null);
    }
  }, [canUseViewAs, ready]);

  useEffect(() => {
    if (!canUseViewAs || !pendingUserId) return;
    let cancelled = false;
    (async () => {
      try {
        const { api } = await import("@/lib/api");
        const users = await api.tenants.users(enteredTenant!.id);
        const match = users.find((u) => u.id === pendingUserId) ?? null;
        if (!cancelled) {
          setViewingAsState(match);
          if (!match) writeStoredUserId(null);
        }
      } catch {
        if (!cancelled) {
          setViewingAsState(null);
          writeStoredUserId(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canUseViewAs, pendingUserId, enteredTenant]);

  const setViewingAs = useCallback(
    (next: UserDTO | null) => {
      if (!canUseViewAs) return;
      setViewingAsState(next);
      writeStoredUserId(next?.id ?? null);
      setPendingUserId(next?.id ?? null);
    },
    [canUseViewAs],
  );

  const effectiveHasPermission = useCallback(
    (perm: string) => {
      if (viewingAs && canUseViewAs) return userHasPermission(viewingAs, perm);
      return hasPermission(perm);
    },
    [viewingAs, canUseViewAs, hasPermission],
  );

  const effectiveUser = useMemo(() => {
    if (viewingAs && canUseViewAs) return viewingAs;
    return null;
  }, [viewingAs, canUseViewAs]);

  const value = useMemo<ViewAsCtx>(
    () => ({
      viewingAs: canUseViewAs ? viewingAs : null,
      setViewingAs,
      effectiveHasPermission,
      effectiveUser,
    }),
    [viewingAs, canUseViewAs, setViewingAs, effectiveHasPermission, effectiveUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useViewAs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useViewAs must be used within ViewAsProvider");
  return ctx;
}

export function useEffectivePermission() {
  const { effectiveHasPermission } = useViewAs();
  return effectiveHasPermission;
}
