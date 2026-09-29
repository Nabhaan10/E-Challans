import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/StatCard";

export const Route = createFileRoute("/_authenticated/admin/users")({
  
  head: () => ({ meta: [{ title: "Admin Users — e-Challan" }] }),
  component: () => (
    <div>
      <PageHeader title="Admin Users" />
      <EmptyState title="This page is being built" hint="It will be available in the next update." />
    </div>
  ),
});
