import { Link } from "@tanstack/react-router";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "./StatCard";
import { inr, fmtDate, labelize } from "@/lib/format";
import type { ChallanRow } from "@/lib/data";

export function ChallanTable({ rows, empty = "No challans found" }: { rows: ChallanRow[]; empty?: string }) {
  if (!rows.length) return <EmptyState title={empty} />;
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            {["Challan ID", "Vehicle", "Violation", "Amount", "Date", "Status", ""].map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((c) => (
            <tr key={c.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-mono font-semibold">{c.challan_no}</td>
              <td className="px-4 py-3">
                <span className="font-mono">{c.vehicles?.reg_no}</span>
                <span className="block text-xs text-muted-foreground">{labelize(c.vehicles?.vehicle_type ?? "")}</span>
              </td>
              <td className="px-4 py-3">{c.traffic_violations?.name}</td>
              <td className="px-4 py-3 font-semibold">{inr(c.amount)}</td>
              <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.issued_at)}</td>
              <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
              <td className="px-4 py-3 text-right">
                <Link to="/challans/$id" params={{ id: c.id }} className="text-sm font-semibold text-primary underline-offset-2 hover:underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
