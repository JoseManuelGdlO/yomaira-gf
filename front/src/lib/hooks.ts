import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Medication } from "@/mocks/data";
import { useAuth } from "@/lib/auth";

export function useMedications(): Medication[] {
  const { user, ready } = useAuth();
  const q = useQuery({
    queryKey: ["medications"],
    queryFn: () => api.medications.list(),
    enabled: ready && !!user,
    staleTime: 5 * 60_000,
    placeholderData: [],
  });
  return q.data ?? [];
}
