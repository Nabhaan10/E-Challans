import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RequireRole } from "@/components/AppShell";
import { PageHeader, Loading } from "@/components/StatCard";
import type { MapPoint } from "@/components/HotspotMap";

const HotspotMap = lazy(() => import("@/components/HotspotMap"));

export const Route = createFileRoute("/_authenticated/admin/map")({
  head: () => ({ meta: [{ title: "Violation Hotspot Map ΓÇö e-Challan" }] }),
  component: () => (
    <RequireRole roles={["admin", "officer"]}>
      <MapPage />
    </RequireRole>
  ),
});

function MapPage() {
  const [days, setDays] = useState(90);
  const q = useQuery({
    queryKey: ["map-challans", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 864e5).toISOString();
      const { data } = await supabase
        .from("challans")
        .select("lat,lng,location_text,traffic_violations(name)")
        .gte("issued_at", since)
        .not("lat", "is", null)
        .limit(5000);
      return data ?? [];
    },
  });
  const { points, top } = useMemo(() => {
    const m = new Map<string, MapPoint & { v: Map<string, number> }>();
    (q.data ?? []).forEach((c) => {
      const key = `${c.lat!.toFixed(2)},${c.lng!.toFixed(2)}`;
      const e = m.get(key) ?? { lat: c.lat!, lng: c.lng!, label: c.location_text.split(",")[0] ?? "", count: 0, v: new Map() };
      e.count++;
      const vn = (c.traffic_violations as { name: string } | null)?.name ?? "ΓÇö";
      e.v.set(vn, (e.v.get(vn) ?? 0) + 1);
      m.set(key, e);
    });
    const all = [...m.values()].sort((a, b) => b.count - a.count);
    return {
      points: all.map(({ lat, lng, label, count }) => ({ lat, lng, label, count })),
      top: all.slice(0, 10).map((p) => ({ ...p, main: [...p.v.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "" })),
    };
  }, [q.data]);

  return (
    <div>
      <PageHeader
        title="Hotspot Map"
        subtitle={`${q.data?.length ?? 0} geotagged challans`}
        actions={
          <select value={days} onChange={(e) => setDays(+e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        }
      />
      {q.isLoading ? <Loading /> : (
        <div className="grid gap-4 xl:grid-cols-[3fr_1fr]">
          <ClientOnly fallback={<div className="h-[520px] animate-pulse rounded-lg bg-muted" />}>
            <Suspense fallback={<div className="h-[520px] animate-pulse rounded-lg bg-muted" />}>
              <HotspotMap points={points} />
            </Suspense>
          </ClientOnly>
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-xl font-bold uppercase">Top hotspots</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {top.map((p, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span><b>{i + 1}.</b> {p.label}<br /><span className="text-xs text-muted-foreground">Mostly: {p.main}</span></span>
                  <span className="font-mono font-bold">{p.count}</span>
                </li>
              ))}
              {!top.length && <li className="text-muted-foreground">No geotagged data in this period.</li>}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
