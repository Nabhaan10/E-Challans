import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/StatCard";

export const Route = createFileRoute("/_authenticated/vehicles/")({
  
  head: () => ({ meta: [{ title: "Vehicles — e-Challan" }] }),
  component: () => (
    <div>
      <PageHeader title="Vehicles" />
      <EmptyState title="This page is being built" hint="It will be available in the next update." />
    </div>
  ),
});
