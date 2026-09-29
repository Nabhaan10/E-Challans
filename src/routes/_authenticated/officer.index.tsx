import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, FileWarning, Search } from "lucide-react";
import { fetchChallans, fetchPayments, groupCount, dailySeries } from "@/lib/data";
import { StatCard, PageHeader, Loading } from "@/components/StatCard";
import { ChallanTable } from "@/components/ChallanTable";
import { ChartCard, HBar, Trend, Donut } from "@/components/Charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inr, normalizeReg, labelize } from "@/lib/format";
import { RequireRole } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/officer/")({
  head: () => ({ meta: [{ title: "Officer Dashboard — e-Challan" }] }),
  component: () => (
    <RequireRole roles={["officer", "admin"]}>
      <OfficerDashboard />
    </RequireRole>
  ),
});

function OfficerDashboard() {
  const navigate = useNavigate();
  const [reg, setReg] = useState("");
  const challans = useQuery({ queryKey: ["challans", "all"], queryFn: () => fetchChallans() });
  const payments = useQuery({ queryKey: ["payments"], queryFn: fetchPayments });
  const rows = challans.data ?? [];
  const pays = payments.data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        subtitle="Live enforcement overview"
        actions={
          <>
            <Button asChild><Link to="/officer/issue"><FileWarning size={16} /> Issue Challan</Link></Button>
            <Button asChild variant="outline"><Link to="/rules"><BookOpen size={16} /> View Violations</Link></Button>
          </>
        }
      />
      <form
        className="mb-6 flex max-w-lg gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (reg.trim()) navigate({ to: "/search", search: { q: normalizeReg(reg) } });
        }}
      >
        <Input value={reg} onChange={(e) => setReg(e.target.value)} placeholder="Search vehicle or challan — e.g. KL07AB1234" className="font-mono uppercase" />
        <Button type="submit" variant="secondary"><Search size={16} /> Search</Button>
      </form>
      {challans.isLoading ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Today's challans" value={rows.filter((c) => c.issued_at.startsWith(today)).length} />
            <StatCard label="Pending" value={rows.filter((c) => ["PENDING", "OVERDUE", "ESCALATED"].includes(c.status)).length} tone="warning" />
            <StatCard label="Paid" value={rows.filter((c) => c.status === "PAID").length} tone="success" />
            <StatCard label="Disputed" value={rows.filter((c) => ["DISPUTED", "UNDER_REVIEW"].includes(c.status)).length} tone="info" />
            <StatCard label="Today's collection" value={inr(pays.filter((p) => p.paid_at.startsWith(today)).reduce((s, p) => s + p.amount, 0))} tone="success" />
            <StatCard label="Monthly collection" value={inr(pays.filter((p) => p.paid_at.startsWith(month)).reduce((s, p) => s + p.amount, 0))} tone="success" />
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Violations by category"><HBar data={groupCount(rows, (c) => c.traffic_violations?.category ?? "—")} /></ChartCard>
            <ChartCard title="Daily challan count (30 days)"><Trend data={dailySeries(rows, (c) => c.issued_at, () => 1)} /></ChartCard>
            <ChartCard title="Paid vs pending vs disputed"><Donut data={groupCount(rows, (c) => labelize(c.status))} /></ChartCard>
            <ChartCard title="Fine collection over time"><Trend money data={dailySeries(pays, (p) => p.paid_at, (p) => p.amount)} /></ChartCard>
          </div>
          <h2 className="mb-3 mt-8 text-2xl font-bold uppercase">Recent challans</h2>
          <ChallanTable rows={rows.slice(0, 10)} />
        </>
      )}
    </div>
  );
}
