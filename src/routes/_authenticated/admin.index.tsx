import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchChallans, fetchPayments, groupCount, dailySeries } from "@/lib/data";
import { StatCard, PageHeader, Loading } from "@/components/StatCard";
import { ChartCard, HBar, Trend, Donut } from "@/components/Charts";
import { RequireRole } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { inr, labelize } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — e-Challan" }] }),
  component: () => (
    <RequireRole roles={["admin"]}>
      <AdminDashboard />
    </RequireRole>
  ),
});

function AdminDashboard() {
  const challans = useQuery({ queryKey: ["challans", "all"], queryFn: () => fetchChallans() });
  const payments = useQuery({ queryKey: ["payments"], queryFn: fetchPayments });
  const counts = useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const [roles, vehicles, appeals] = await Promise.all([
        supabase.from("user_roles").select("role"),
        supabase.from("vehicles").select("vehicle_type"),
        supabase.from("appeals").select("status"),
      ]);
      return { roles: roles.data ?? [], vehicles: vehicles.data ?? [], appeals: appeals.data ?? [] };
    },
  });
  if (challans.isLoading || counts.isLoading) return <Loading />;
  const rows = challans.data ?? [];
  const pays = payments.data ?? [];
  const c = counts.data!;

  return (
    <div>
      <PageHeader
        title="Control Room"
        subtitle="System-wide statistics and analytics from live data"
        actions={
          <>
            <Button asChild variant="outline"><Link to="/admin/map">Hotspot map</Link></Button>
            <Button asChild variant="outline"><Link to="/admin/assistant">Ask the data</Link></Button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Total users" value={c.roles.length} />
        <StatCard label="Citizens" value={c.roles.filter((r) => r.role === "citizen").length} />
        <StatCard label="Officers" value={c.roles.filter((r) => r.role === "officer").length} />
        <StatCard label="Vehicles" value={c.vehicles.length} />
        <StatCard label="Challans" value={rows.length} tone="warning" />
        <StatCard label="Revenue" value={inr(pays.reduce((s, p) => s + p.amount, 0))} tone="success" />
        <StatCard label="Pending appeals" value={c.appeals.filter((a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW").length} tone="info" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Challans over time"><Trend data={dailySeries(rows, (r) => r.issued_at, () => 1, 60)} /></ChartCard>
        <ChartCard title="Revenue over time"><Trend money data={dailySeries(pays, (p) => p.paid_at, (p) => p.amount, 60)} /></ChartCard>
        <ChartCard title="Violations by type"><HBar data={groupCount(rows, (r) => r.traffic_violations?.name ?? "—")} /></ChartCard>
        <ChartCard title="Payment status"><Donut data={groupCount(rows, (r) => labelize(r.status))} /></ChartCard>
        <ChartCard title="Appeals by status"><Donut data={groupCount(c.appeals, (a) => labelize(a.status))} /></ChartCard>
        <ChartCard title="Violations by location"><HBar data={groupCount(rows, (r) => r.location_text.split(",")[0] ?? "—").slice(0, 8)} /></ChartCard>
        <ChartCard title="Vehicle type distribution"><Donut data={groupCount(c.vehicles, (v) => labelize(v.vehicle_type))} /></ChartCard>
      </div>
    </div>
  );
}
