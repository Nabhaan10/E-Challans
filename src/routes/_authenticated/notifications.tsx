import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/StatCard";

export const Route = createFileRoute("/_authenticated/notifications")({
  
  head: () => ({ meta: [{ title: "Notifications — e-Challan" }] }),
  component: () => (
    <div>
      <PageHeader title="Notifications" />
      <EmptyState title="This page is being built" hint="It will be available in the next update." />
    </div>
  ),
});
