import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchChallans } from "@/lib/data";
import { PageHeader, Loading } from "@/components/StatCard";
import { ChallanTable } from "@/components/ChallanTable";
import { Input } from "@/components/ui/input";
import { labelize } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/challans/")({
  head: () => ({ meta: [{ title: "Challans ΓÇö e-Challan" }] }),
  component: ChallansPage,
});

const STATUSES = ["ALL", "PENDING", "OVERDUE", "ESCALATED", "DISPUTED", "UNDER_REVIEW", "PAID", "RESOLVED"];

function ChallansPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const { data, isLoading } = useQuery({ queryKey: ["challans", "all"], queryFn: () => fetchChallans() });
  const term = q.trim().toUpperCase();
  const rows = (data ?? []).filter(
    (c) =>
      (status === "ALL" || c.status === status) &&
      (!term || c.challan_no.includes(term) || c.vehicles?.reg_no.includes(term) || c.traffic_violations?.name.toUpperCase().includes(term)),
  );
  return (
    <div>
      <PageHeader title="Challans" subtitle={`${rows.length} record(s)`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Challan no, vehicle or violation" className="max-w-xs" />
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
        </select>
      </div>
      {isLoading ? <Loading /> : <ChallanTable rows={rows} />}
    </div>
  );
}
