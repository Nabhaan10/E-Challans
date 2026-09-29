import { createFileRoute, redirect } from "@tanstack/react-router";
import { loadSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const s = await loadSession();
    if (!s) throw redirect({ to: "/auth" });
    return s;
  },
  component: AppShell,
});
