import { useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import type { FranklSummary } from "@/lib/frankl";

export function useFranklSummariesMap(patientIds: string[]): Map<string, FranklSummary> {
  const { user } = useAuth();
  const brandingId = user?.brandingId;
  const unique = [...new Set(patientIds.filter(Boolean))];

  const queries = useQueries({
    queries: unique.map((patientId) => ({
      queryKey: tenantKey(["frankl-summary", patientId], brandingId),
      queryFn: () => api.frankl.summary(patientId),
      enabled: !!patientId && !!brandingId,
      staleTime: 60_000,
    })),
  });

  const map = new Map<string, FranklSummary>();
  unique.forEach((id, i) => {
    const data = queries[i]?.data;
    if (data) map.set(id, data);
  });
  return map;
}
