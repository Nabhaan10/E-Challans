import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Loading, EmptyState } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { labelize, docState } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/vehicles/")({
  head: () => ({ meta: [{ title: "Vehicles — e-Challan" }] }),
  component: VehiclesPage,
});

function VehiclesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => (await supabase.from("vehicles").select("id,reg_no,vehicle_type,make,model,insurance_expiry,puc_expiry").order("reg_no").limit(500)).data ?? [],
  });
  if (isLoading) return <Loading />;
  return (
    <div>
      <PageHeader title="Vehicles" />
      {!data?.length ? <EmptyState title="No vehicles" /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((v) => (
            <Link key={v.id} to="/vehicles/$id" params={{ id: v.id }} className="rounded-lg border bg-card p-4 hover:border-primary">
              <p className="font-mono text-xl font-bold">{v.reg_no}</p>
              <p className="text-sm text-muted-foreground">{labelize(v.vehicle_type)} · {v.make} {v.model}</p>
              <div className="mt-2 flex gap-2 text-xs">Insurance <StatusBadge status={docState(v.insurance_expiry).state} /> PUC <StatusBadge status={docState(v.puc_expiry).state} /></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
