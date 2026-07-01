import { createFileRoute, redirect } from "@tanstack/react-router";
import { getToken } from "@/lib/api";
import { api } from "@/lib/api";
import { homeRouteForUser } from "@/lib/auth-guard";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") {
      throw redirect({ to: "/login" });
    }
    const token = getToken();
    if (!token) {
      throw redirect({ to: "/login" });
    }
    try {
      const user = await api.auth.me();
      throw redirect({ to: homeRouteForUser(user) });
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) throw err;
      throw redirect({ to: "/login" });
    }
  },
});
