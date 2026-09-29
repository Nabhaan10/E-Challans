import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/StatCard";

export const Route = createFileRoute("/_authenticated/rules/")({
  
  head: () => ({ meta: [{ title: "Traffic Rules — e-Challan" }] }),
  component: () => (
    <div>
      <PageHeader title="Traffic Rules" />
      <EmptyState title="This page is being built" hint="It will be available in the next update." />
    </div>
  ),
});
