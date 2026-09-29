import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/StatCard";

export const Route = createFileRoute("/_authenticated/challans/")({
  
  head: () => ({ meta: [{ title: "Challans — e-Challan" }] }),
  component: () => (
    <div>
      <PageHeader title="Challans" />
      <EmptyState title="This page is being built" hint="It will be available in the next update." />
    </div>
  ),
});
