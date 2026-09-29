import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/StatCard";

export const Route = createFileRoute("/_authenticated/admin/map")({
  
  head: () => ({ meta: [{ title: "Admin Map — e-Challan" }] }),
  component: () => (
    <div>
      <PageHeader title="Admin Map" />
      <EmptyState title="This page is being built" hint="It will be available in the next update." />
    </div>
  ),
});
