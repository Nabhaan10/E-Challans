import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/StatCard";

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => (typeof s["q"] === "string" ? { q: s["q"] } : {}),
  head: () => ({ meta: [{ title: "Search — e-Challan" }] }),
  component: () => (
    <div>
      <PageHeader title="Search" />
      <EmptyState title="This page is being built" hint="It will be available in the next update." />
    </div>
  ),
});
