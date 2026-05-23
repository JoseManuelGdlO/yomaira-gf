import { createFileRoute, redirect } from "@tanstack/react-router";
import { getToken } from "@/lib/api";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window === "undefined") {
      throw redirect({ to: "/login" });
    }
    const token = getToken();
    throw redirect({ to: token ? "/dashboard" : "/login" });
  },
});
