import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/StatCard";
import { RequireRole } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { inr, fmtDateTime, labelize, normalizeReg, docState, errMsg } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/officer/issue")({
  head: () => ({ meta: [{ title: "Issue Challan — e-Challan" }] }),
  component: () => (
    <RequireRole roles={["officer", "admin"]}>
      <IssueChallan />
    </RequireRole>
  ),
});

type Vehicle = {
  id: string; reg_no: string; vehicle_type: string; make: string; model: string;
  insurance_expiry: string | null; puc_expiry: string | null; registration_expiry: string | null;
  profiles: { full_name: string } | null;
};

const sel = "h-10 w-full rounded-md border bg-background px-3 text-sm";

function IssueChallan() {
  const navigate = useNavigate();
  const [reg, setReg] = useState("");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [violationId, setViolationId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  const violations = useQuery({
    queryKey: ["violations"],
    queryFn: async () => (await supabase.from("traffic_violations").select("id,code,name,category").order("category")).data ?? [],
  });
  const locations = useQuery({
    queryKey: ["locations"],
    queryFn: async () => (await supabase.from("locations").select("id,name,area,city,lat,lng").order("name")).data ?? [],
  });
  const fine = useQuery({
    queryKey: ["resolve", vehicle?.id, violationId],
    enabled: !!vehicle && !!violationId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("resolve_fine", { _vehicle_id: vehicle!.id, _violation_id: violationId });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
  const loc = locations.data?.find((l) => l.id === locationId);
  const dups = useQuery({
    queryKey: ["dups", vehicle?.id, violationId, locationId],
    enabled: !!vehicle && !!violationId && !!loc,
    queryFn: async () =>
      (await supabase.rpc("check_duplicate_challans", { _vehicle_id: vehicle!.id, _violation_id: violationId, _lat: loc!.lat, _lng: loc!.lng, _hours: 24 })).data ?? [],
  });

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setNotFound(false);
    setVehicle(null);
    const { data } = await supabase
      .from("vehicles")
      .select("id,reg_no,vehicle_type,make,model,insurance_expiry,puc_expiry,registration_expiry,profiles!vehicles_owner_id_fkey(full_name)")
      .eq("reg_no", normalizeReg(reg))
      .maybeSingle();
    if (!data) setNotFound(true);
    else setVehicle(data as unknown as Vehicle);
  }

  async function issue() {
    if (!vehicle || !violationId || !loc) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("issue_challan", {
      _vehicle_id: vehicle.id, _violation_id: violationId, _location_id: loc.id,
      _location_text: `${loc.name}, ${loc.area}, ${loc.city}`, _lat: loc.lat, _lng: loc.lng, _remarks: remarks.trim().slice(0, 500),
    });
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success(`Challan ${data.challan_no} issued`);
    navigate({ to: "/challans/$id", params: { id: data.id } });
  }

  const grouped = new Map<string, NonNullable<typeof violations.data>>();
  (violations.data ?? []).forEach((v) => grouped.set(v.category, [...(grouped.get(v.category) ?? []), v]));

  return (
    <div className="max-w-4xl">
      <PageHeader title="Issue Challan" subtitle="1. Look up vehicle · 2. Select violation · 3. Confirm & issue" />
      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-xl font-bold uppercase">1. Vehicle lookup</h2>
        <form onSubmit={lookup} className="flex gap-2">
          <Input value={reg} onChange={(e) => setReg(e.target.value)} placeholder="KL07AB1234" className="font-mono uppercase" maxLength={15} />
          <Button type="submit"><Search size={16} /> Look up</Button>
        </form>
        {notFound && <p className="mt-3 text-sm text-destructive">No registered vehicle found for that number.</p>}
        {vehicle && (
          <div className="mt-4 grid gap-3 rounded-md bg-muted/40 p-4 sm:grid-cols-2">
            <div>
              <p className="font-mono text-2xl font-bold">{vehicle.reg_no}</p>
              <p className="text-sm text-muted-foreground">{labelize(vehicle.vehicle_type)} · {vehicle.make} {vehicle.model}</p>
              <p className="text-sm">Owner: <b>{vehicle.profiles?.full_name || "—"}</b></p>
            </div>
            <div className="space-y-1 text-sm">
              {([["Insurance", vehicle.insurance_expiry], ["PUC", vehicle.puc_expiry], ["Registration", vehicle.registration_expiry]] as const).map(([k, d]) => (
                <p key={k} className="flex items-center justify-between gap-2">{k} <StatusBadge status={docState(d).state} /></p>
              ))}
            </div>
          </div>
        )}
      </section>

      {vehicle && (
        <section className="mt-4 rounded-lg border bg-card p-5">
          <h2 className="mb-3 text-xl font-bold uppercase">2. Violation & location</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Violation</Label>
              <select className={sel} value={violationId} onChange={(e) => setViolationId(e.target.value)}>
                <option value="">Select violation…</option>
                {[...grouped.entries()].map(([cat, list]) => (
                  <optgroup key={cat} label={cat}>
                    {list.map((v) => <option key={v.id} value={v.id}>{v.code} — {v.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <Label>Location</Label>
              <select className={sel} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                <option value="">Select location…</option>
                {(locations.data ?? []).map((l) => <option key={l.id} value={l.id}>{l.name}, {l.area}, {l.city}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>Remarks (optional)</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength={500} rows={2} />
            </div>
          </div>
        </section>
      )}

      {vehicle && violationId && (
        <section className="mt-4 rounded-lg border bg-card p-5">
          <h2 className="mb-3 text-xl font-bold uppercase">3. Confirm</h2>
          {fine.data ? (
            fine.data.applicable ? (
              <div className="space-y-1 text-sm">
                <p>Legal basis: <b>{fine.data.legal_act}, Section {fine.data.section}</b></p>
                <p>Base fine {inr(fine.data.base_fine)} + additional {inr(fine.data.additional_penalty)}</p>
                <p className="font-display text-3xl font-bold">{inr(fine.data.base_fine + fine.data.additional_penalty)}</p>
                {fine.data.is_sample && <p className="text-xs text-muted-foreground">Sample amount — verify against current notification.</p>}
              </div>
            ) : <EmptyState title="This violation does not apply to this vehicle type" />
          ) : <p className="text-sm text-muted-foreground">Calculating fine…</p>}
          {!!dups.data?.length && (
            <div className="mt-4 rounded-md border border-warning/60 bg-warning/10 p-3 text-sm">
              <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} /> Possible duplicate in last 24h</p>
              {dups.data.map((d) => <p key={d.id} className="font-mono text-xs">{d.challan_no} · {d.location_text} · {fmtDateTime(d.issued_at)}</p>)}
            </div>
          )}
          <Button className="mt-4" disabled={busy || !loc || !fine.data?.applicable} onClick={issue}>
            {busy ? "Issuing…" : "Issue challan"}
          </Button>
          {!loc && <p className="mt-2 text-xs text-muted-foreground">Select a location to continue.</p>}
        </section>
      )}
    </div>
  );
}
