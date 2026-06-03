import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import type { ClinicalSafetyContext, ClinicalSafetyReport, PrescriptionItemInput } from "@/lib/clinicalSafety";

export function useClinicalSafety(
  patientId: string | undefined,
  context: ClinicalSafetyContext,
  items?: PrescriptionItemInput[],
  debounceMs = 400,
) {
  const { user } = useAuth();
  const brandingId = user?.brandingId;
  const [debouncedItems, setDebouncedItems] = useState<PrescriptionItemInput[] | undefined>(items);

  useEffect(() => {
    if (items === undefined) {
      setDebouncedItems(undefined);
      return;
    }
    const t = setTimeout(() => setDebouncedItems(items), debounceMs);
    return () => clearTimeout(t);
  }, [items, debounceMs]);

  const staticQ = useQuery({
    queryKey: tenantKey(["clinical-safety", patientId, context], brandingId),
    queryFn: () => api.clinicalSafety.get(patientId!, context),
    enabled: !!patientId && debouncedItems === undefined,
    staleTime: 30_000,
  });

  const checkQ = useQuery({
    queryKey: tenantKey(
      ["clinical-safety-check", patientId, context, JSON.stringify(debouncedItems ?? [])],
      brandingId,
    ),
    queryFn: () =>
      api.clinicalSafety.check(patientId!, {
        context,
        items: debouncedItems ?? [],
      }),
    enabled: !!patientId && debouncedItems !== undefined,
    staleTime: 5_000,
  });

  const report: ClinicalSafetyReport | undefined =
    debouncedItems !== undefined ? checkQ.data : staticQ.data;

  return {
    report,
    isLoading: debouncedItems !== undefined ? checkQ.isFetching : staticQ.isLoading,
  };
}
