import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RequireRole } from "@/components/AppShell";
import { PageHeader, Loading, EmptyState } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({ meta: [{ title: "Audit Log — e-Challan" }] }),
  component: () => (
    <RequireRole roles={["admin"]}>
      <AuditLog />
    </RequireRole>
  ),
});

function AuditLog() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
  const t = q.toLowerCase();
  const rows = (data ?? []).filter((r) => !t || `${r.action} ${r.entity} ${r.actor_role} ${r.entity_id}`.toLowerCase().includes(t));
  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Latest 500 system events (read-only)" />
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by action, entity, role" className="mb-4 max-w-sm" />
      {isLoading ? <Loading /> : !rows.length ? <EmptyState title="No events" /> : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>{["Time", "Action", "Entity", "Actor role", "Details"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{fmtDateTime(r.created_at)}</td>
                  <td className="px-3 py-2 font-mono text-xs font-semibold">{r.action}</td>
                  <td className="px-3 py-2">{r.entity}{r.entity_id ? <span className="block font-mono text-[10px] text-muted-foreground">{r.entity_id}</span> : null}</td>
                  <td className="px-3 py-2">{r.actor_role ?? "system"}</td>
                  <td className="max-w-xs truncate px-3 py-2 font-mono text-[11px] text-muted-foreground" title={JSON.stringify(r.metadata)}>{JSON.stringify(r.metadata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
