import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/StatCard";

export const Route = createFileRoute("/_authenticated/officer/issue")({
  
  head: () => ({ meta: [{ title: "Issue Challan — e-Challan" }] }),
  component: () => (
    <div>
      <PageHeader title="Issue Challan" />
      <EmptyState title="This page is being built" hint="It will be available in the next update." />
    </div>
  ),
});
