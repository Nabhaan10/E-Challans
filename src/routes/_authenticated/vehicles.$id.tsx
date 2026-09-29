import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/StatCard";

export const Route = createFileRoute("/_authenticated/vehicles/$id")({
  
  head: () => ({ meta: [{ title: "Vehicle Details — e-Challan" }] }),
  component: () => (
    <div>
      <PageHeader title="Vehicle Details" />
      <EmptyState title="This page is being built" hint="It will be available in the next update." />
    </div>
  ),
});
