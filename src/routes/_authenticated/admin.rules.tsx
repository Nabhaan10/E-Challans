import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RequireRole } from "@/components/AppShell";
import { PageHeader, Loading } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { errMsg } from "@/lib/format";
import { rulesQuery } from "./rules.index";

export const Route = createFileRoute("/_authenticated/admin/rules")({
  head: () => ({ meta: [{ title: "Rules Editor — e-Challan" }] }),
  component: () => (
    <RequireRole roles={["admin"]}>
      <RulesEditor />
    </RequireRole>
  ),
});

function RulesEditor() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(rulesQuery);
  const [edits, setEdits] = useState<Record<string, { base: string; add: string }>>({});

  async function savePenalty(id: string) {
    const e = edits[id];
    if (!e) return;
    const base = Number(e.base), add = Number(e.add);
    if (!Number.isInteger(base) || base < 0 || base > 1000000 || !Number.isInteger(add) || add < 0 || add > 1000000) return toast.error("Enter valid whole amounts");
    const { error } = await supabase.from("violation_penalties").update({ base_fine: base, additional_penalty: add }).eq("id", id);
    if (error) return toast.error(errMsg(error));
    toast.success("Penalty updated (logged in audit)");
    qc.invalidateQueries({ queryKey: rulesQuery.queryKey });
  }
  async function toggle(id: string, active: boolean) {
    const { error } = await supabase.from("traffic_rules").update({ active, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(errMsg(error));
    qc.invalidateQueries({ queryKey: rulesQuery.queryKey });
  }

  if (isLoading) return <Loading />;
  return (
    <div>
      <PageHeader title="Rules Editor" subtitle="Edit fines and activate/deactivate rules. Changes apply to new challans only." />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>{["Violation", "Legal basis", "Base fine", "Additional", "", "Active"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {(data ?? []).flatMap((v) =>
              v.traffic_rules.map((r) => {
                const p = r.violation_penalties[0];
                const e = p ? edits[p.id] ?? { base: String(p.base_fine), add: String(p.additional_penalty) } : null;
                return (
                  <tr key={r.id}>
                    <td className="px-3 py-2"><span className="font-mono text-xs">{v.code}</span> {v.name}</td>
                    <td className="px-3 py-2 text-xs">{r.legal_act} §{r.section} · {r.applicability}</td>
                    {p && e ? (
                      <>
                        <td className="px-3 py-2"><Input className="w-28" inputMode="numeric" value={e.base} onChange={(x) => setEdits({ ...edits, [p.id]: { ...e, base: x.target.value } })} /></td>
                        <td className="px-3 py-2"><Input className="w-28" inputMode="numeric" value={e.add} onChange={(x) => setEdits({ ...edits, [p.id]: { ...e, add: x.target.value } })} /></td>
                        <td className="px-3 py-2"><Button size="sm" variant="outline" disabled={!edits[p.id]} onClick={() => savePenalty(p.id)}>Save</Button></td>
                      </>
                    ) : <td colSpan={3} className="px-3 py-2 text-muted-foreground">No penalty</td>}
                    <td className="px-3 py-2"><Switch checked={r.active} onCheckedChange={(c) => toggle(r.id, c)} /></td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
