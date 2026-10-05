import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CHALLAN_SELECT, type ChallanRow } from "@/lib/data";
import { PageHeader, Loading, EmptyState } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ChallanTable } from "@/components/ChallanTable";
import { labelize, docState, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/vehicles/$id")({
  head: () => ({ meta: [{ title: "Vehicle Details ΓÇö e-Challan" }] }),
  component: VehicleDetail,
});

function VehicleDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      const [v, c] = await Promise.all([
        supabase.from("vehicles").select("*").eq("id", id).maybeSingle(),
        supabase.from("challans").select(CHALLAN_SELECT).eq("vehicle_id", id).order("issued_at", { ascending: false }),
      ]);
      return { v: v.data, challans: (c.data ?? []) as unknown as ChallanRow[] };
    },
  });
  if (isLoading) return <Loading />;
  const v = data?.v;
  if (!v) return <EmptyState title="Vehicle not found" />;
  return (
    <div>
      <PageHeader title={v.reg_no} subtitle={`${labelize(v.vehicle_type)} ┬╖ ${v.make} ${v.model} ┬╖ ${v.fuel_type}`} />
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {([["Registration", v.registration_expiry], ["Insurance", v.insurance_expiry], ["PUC", v.puc_expiry]] as const).map(([k, d]) => (
          <div key={k} className="rounded-lg border bg-card p-3 text-sm">
            <p className="text-xs uppercase text-muted-foreground">{k}</p>
            <p>{fmtDate(d)}</p>
            <StatusBadge status={docState(d).state} />
          </div>
        ))}
        <div className="rounded-lg border bg-card p-3 text-sm"><p className="text-xs uppercase text-muted-foreground">Registered</p><p>{fmtDate(v.registration_date)}</p></div>
      </div>
      <h2 className="mb-3 text-2xl font-bold uppercase">Challan history</h2>
      <ChallanTable rows={data!.challans} />
    </div>
  );
}
