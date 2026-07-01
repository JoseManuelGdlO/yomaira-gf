import { useAuth } from "@/lib/auth";
import { useViewAs } from "@/lib/viewAs";

/** Permission check that respects "Ver como" preview when active. */
export function usePermissionCheck() {
  const { hasPermission } = useAuth();
  const { viewingAs, effectiveHasPermission } = useViewAs();
  return viewingAs ? effectiveHasPermission : hasPermission;
}
