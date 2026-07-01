import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { TenantDTO } from "@/lib/api";
import { setActingTenantId } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth-guard";
import { clearTenantQueries } from "@/lib/tenantQuery";

const STORAGE_KEY = "med:entered-tenant";

type PlatformTenantCtx = {
  enteredTenant: TenantDTO | null;
  effectiveBrandingId: string | undefined;
  enterTenant: (tenant: TenantDTO) => void;
  exitTenant: () => void;
};

const Ctx = createContext<PlatformTenantCtx | null>(null);

function readStoredTenant(): TenantDTO | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TenantDTO;
  } catch {
    return null;
  }
}

function writeStoredTenant(tenant: TenantDTO | null): void {
  try {
    if (tenant) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tenant));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function PlatformTenantProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { user, ready } = useAuth();
  const [enteredTenant, setEnteredTenant] = useState<TenantDTO | null>(() => readStoredTenant());

  const syncActingTenant = useCallback((tenant: TenantDTO | null) => {
    if (user && isPlatformAdmin(user) && tenant) {
      setActingTenantId(tenant.id);
    } else {
      setActingTenantId(null);
    }
  }, [user]);

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      setEnteredTenant(null);
      writeStoredTenant(null);
      setActingTenantId(null);
      return;
    }
    if (!isPlatformAdmin(user)) {
      setEnteredTenant(null);
      writeStoredTenant(null);
      setActingTenantId(null);
      return;
    }
    const stored = readStoredTenant();
    setEnteredTenant(stored);
    syncActingTenant(stored);
  }, [user, ready, syncActingTenant]);

  const enterTenant = useCallback(
    (tenant: TenantDTO) => {
      if (!user || !isPlatformAdmin(user)) return;
      clearTenantQueries(qc);
      setEnteredTenant(tenant);
      writeStoredTenant(tenant);
      setActingTenantId(tenant.id);
    },
    [qc, user],
  );

  const exitTenant = useCallback(() => {
    clearTenantQueries(qc);
    setEnteredTenant(null);
    writeStoredTenant(null);
    setActingTenantId(null);
  }, [qc]);

  const effectiveBrandingId = useMemo(() => {
    if (user && isPlatformAdmin(user) && enteredTenant) return enteredTenant.id;
    return user?.brandingId;
  }, [user, enteredTenant]);

  const value = useMemo<PlatformTenantCtx>(
    () => ({
      enteredTenant,
      effectiveBrandingId,
      enterTenant,
      exitTenant,
    }),
    [enteredTenant, effectiveBrandingId, enterTenant, exitTenant],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlatformTenant() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlatformTenant must be used within PlatformTenantProvider");
  return ctx;
}

export function getEnteredTenantFromStorage(): TenantDTO | null {
  return readStoredTenant();
}
