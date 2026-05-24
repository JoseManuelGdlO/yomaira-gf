import type { QueryClient } from "@tanstack/react-query";

/** Scope React Query cache keys to the active consultorio. */
export function tenantKey(base: readonly string[], brandingId: string | undefined): readonly string[] {
  return [...base, brandingId ?? "none"];
}

const TENANT_PREFIXES = [
  ["branding"],
  ["patients"],
  ["consultations"],
  ["appointments"],
  ["prescriptions"],
  ["clinical"],
] as const;

export function clearTenantQueries(qc: QueryClient): void {
  for (const prefix of TENANT_PREFIXES) {
    qc.removeQueries({ queryKey: [...prefix] });
  }
}
