import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Loading } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { inr, labelize } from "@/lib/format";
import { rulesQuery } from "@/lib/rules";

export const Route = createFileRoute("/_authenticated/rules/")({
  head: () => ({ meta: [{ title: "Traffic Rules ΓÇö e-Challan" }] }),
  component: RulesPage,
});

function RulesPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery(rulesQuery);
  const t = q.toLowerCase();
  const rows = (data ?? []).filter((v) => !t || `${v.name} ${v.code} ${v.category}`.toLowerCase().includes(t));
  return (
    <div className="max-w-5xl">
      <PageHeader title="Traffic Rules" subtitle="Violations, legal basis and fines (sample amounts)" />
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search violations" className="mb-4 max-w-sm" />
      {isLoading ? <Loading /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((v) => (
            <div key={v.id} className="rounded-lg border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">{v.category} ┬╖ <span className="font-mono">{v.code}</span></p>
              <p className="text-lg font-bold">{v.name}</p>
              <p className="mt-1 text-sm">{v.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">{v.why_exists}</p>
              {v.traffic_rules.filter((r) => r.active).map((r) => (
                <div key={r.id} className="mt-3 rounded bg-muted/40 p-2 text-sm">
                  <p><b>{r.legal_act}</b>, Sec {r.section} ┬╖ {r.applicability}{r.state ? ` (${r.state})` : ""}</p>
                  {r.vehicle_types?.length ? <p className="text-xs text-muted-foreground">{r.vehicle_types.map(labelize).join(", ")}</p> : null}
                  {([] as { id: string; base_fine: number; additional_penalty: number }[]).concat((r.violation_penalties as never) ?? []).map((p) => (
                    <p key={p.id} className="font-semibold">{inr(p.base_fine)}{p.additional_penalty ? ` + ${inr(p.additional_penalty)}` : ""}</p>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
