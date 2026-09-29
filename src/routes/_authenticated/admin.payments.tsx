import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/StatCard";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  
  head: () => ({ meta: [{ title: "Admin Payments — e-Challan" }] }),
  component: () => (
    <div>
      <PageHeader title="Admin Payments" />
      <EmptyState title="This page is being built" hint="It will be available in the next update." />
    </div>
  ),
});
