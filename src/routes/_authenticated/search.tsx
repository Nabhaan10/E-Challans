import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CHALLAN_SELECT, type ChallanRow } from "@/lib/data";
import { PageHeader, Loading, EmptyState } from "@/components/StatCard";
import { ChallanTable } from "@/components/ChallanTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeReg, labelize } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => (typeof s["q"] === "string" ? { q: s["q"] } : {}),
  head: () => ({ meta: [{ title: "Vehicle & Challan Search ΓÇö e-Challan" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [text, setText] = useState(q ?? "");
  const term = q ? normalizeReg(q) : "";
  const res = useQuery({
    queryKey: ["search", term],
    enabled: !!term,
    queryFn: async () => {
      const [veh, ch] = await Promise.all([
        supabase.from("vehicles").select("id,reg_no,vehicle_type,make,model").ilike("reg_no", `%${term}%`).limit(20),
        supabase.from("challans").select(CHALLAN_SELECT).ilike("challan_no", `%${term}%`).limit(20),
      ]);
      const vIds = (veh.data ?? []).map((v) => v.id);
      const byVeh = vIds.length ? (await supabase.from("challans").select(CHALLAN_SELECT).in("vehicle_id", vIds).order("issued_at", { ascending: false })).data ?? [] : [];
      const map = new Map<string, ChallanRow>();
      [...(ch.data ?? []), ...byVeh].forEach((c) => map.set((c as unknown as ChallanRow).id, c as unknown as ChallanRow));
      return { vehicles: veh.data ?? [], challans: [...map.values()] };
    },
  });
  return (
    <div>
      <PageHeader title="Search" subtitle="Look up a vehicle registration or challan number" />
      <form className="mb-6 flex max-w-lg gap-2" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/search", search: { q: text.trim() } }); }}>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="KL07AB1234 or challan no" className="font-mono uppercase" maxLength={30} />
        <Button type="submit"><Search size={16} /> Search</Button>
      </form>
      {!term ? null : res.isLoading ? <Loading /> : (
        <>
          <h2 className="mb-2 text-xl font-bold uppercase">Vehicles</h2>
          {res.data?.vehicles.length ? (
            <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {res.data.vehicles.map((v) => (
                <Link key={v.id} to="/vehicles/$id" params={{ id: v.id }} className="rounded-lg border bg-card p-3 hover:border-primary">
                  <p className="font-mono text-lg font-bold">{v.reg_no}</p>
                  <p className="text-sm text-muted-foreground">{labelize(v.vehicle_type)} ┬╖ {v.make} {v.model}</p>
                </Link>
              ))}
            </div>
          ) : <div className="mb-6"><EmptyState title="No vehicles match" /></div>}
          <h2 className="mb-2 text-xl font-bold uppercase">Challans</h2>
          <ChallanTable rows={res.data?.challans ?? []} />
        </>
      )}
    </div>
  );
}
