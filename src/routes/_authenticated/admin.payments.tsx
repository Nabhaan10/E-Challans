import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPayments, groupCount, dailySeries } from "@/lib/data";
import { RequireRole } from "@/components/AppShell";
import { PageHeader, Loading, StatCard } from "@/components/StatCard";
import { ChartCard, Donut, Trend } from "@/components/Charts";
import { inr, fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  head: () => ({ meta: [{ title: "Payments & Revenue — e-Challan" }] }),
  component: () => (
    <RequireRole roles={["admin"]}>
      <Payments />
    </RequireRole>
  ),
});

function Payments() {
  const { data, isLoading } = useQuery({ queryKey: ["payments"], queryFn: fetchPayments });
  if (isLoading) return <Loading />;
  const rows = data ?? [];
  const total = rows.reduce((s, p) => s + p.amount, 0);
  const month = new Date().toISOString().slice(0, 7);
  return (
    <div>
      <PageHeader title="Payments & Revenue" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total revenue" value={inr(total)} tone="success" />
        <StatCard label="This month" value={inr(rows.filter((p) => p.paid_at.startsWith(month)).reduce((s, p) => s + p.amount, 0))} tone="success" />
        <StatCard label="Transactions" value={rows.length} />
        <StatCard label="Average ticket" value={inr(rows.length ? Math.round(total / rows.length) : 0)} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue (60 days)"><Trend money data={dailySeries(rows, (p) => p.paid_at, (p) => p.amount, 60)} /></ChartCard>
        <ChartCard title="Payment methods"><Donut data={groupCount(rows, (p) => p.method)} /></ChartCard>
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>{["Transaction", "Challan", "Method", "Amount", "Paid at"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {rows.slice(0, 200).map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2 font-mono text-xs">{p.transaction_id}</td>
                <td className="px-3 py-2 font-mono">{(p.challans as { challan_no: string } | null)?.challan_no}</td>
                <td className="px-3 py-2">{p.method}</td>
                <td className="px-3 py-2 font-semibold">{inr(p.amount)}</td>
                <td className="px-3 py-2 text-muted-foreground">{fmtDateTime(p.paid_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
