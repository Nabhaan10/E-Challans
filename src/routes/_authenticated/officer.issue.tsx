import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search, AlertTriangle, Video, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/StatCard";
import { RequireRole } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { inr, fmtDateTime, labelize, normalizeReg, docState, errMsg } from "@/lib/format";

const PIPELINE_API_URL = "http://127.0.0.1:8000";

// ─── CV pipeline types ──────────────────────────────────────────────────────
type Incident = {
  vehicle_id: number;
  plate: string;
  speed: number;
  overspeed: boolean;
  class_name: string;
};

type ProcessingResult = {
  job_id: string;
  status: string;
  processing_time?: number;
  processing_time_seconds?: number;
  output_video_url: string;
  speed_threshold: number;
  ppm: number;
  total_vehicles?: number;
  total_vehicles_logged?: number;
  incidents: Incident[];
};

export const Route = createFileRoute("/_authenticated/officer/issue")({
  head: () => ({ meta: [{ title: "Issue Challan — e-Challan" }] }),
  component: () => (
    <RequireRole roles={["officer", "admin"]}>
      <IssueChallan />
    </RequireRole>
  ),
});

// ─── Vehicle type for manual lookup ─────────────────────────────────────────
type Vehicle = {
  id: string; reg_no: string; vehicle_type: string; make: string; model: string;
  insurance_expiry: string | null; puc_expiry: string | null; registration_expiry: string | null;
  profiles: { full_name: string } | null;
};

const sel = "h-10 w-full rounded-md border bg-background px-3 text-sm";

function IssueChallan() {
  const navigate = useNavigate();

  // ── Manual challan state ─────────────────────────────────────────────────
  const [reg, setReg] = useState("");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [violationId, setViolationId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  // ── CV pipeline state ────────────────────────────────────────────────────
  const [showPipeline, setShowPipeline] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [cvResult, setCvResult] = useState<ProcessingResult | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ── Supabase queries ─────────────────────────────────────────────────────
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

  // ── Manual vehicle lookup ────────────────────────────────────────────────
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

  // ── Issue challan ────────────────────────────────────────────────────────
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

  // ── CV pipeline video processing ─────────────────────────────────────────
  async function processVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!video) return;
    setCvError(null);
    setCvResult(null);
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("video", video);
      const response = await fetch(`${PIPELINE_API_URL}/api/process_video`, {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as ProcessingResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Video processing failed.");
      setCvResult(data);
      // If a plate is detected, pre-fill the reg field for quick lookup
      const speedViolator = data.incidents.find((i) => i.overspeed && i.plate && i.plate !== "—");
      if (speedViolator) {
        setReg(speedViolator.plate);
        toast.info(`Auto-filled plate: ${speedViolator.plate} — click "Look up" to load vehicle.`);
      }
    } catch (caught) {
      setCvError(caught instanceof Error ? caught.message : "Unable to connect to the video-processing API.");
    } finally {
      setIsProcessing(false);
    }
  }

  const grouped = new Map<string, NonNullable<typeof violations.data>>();
  (violations.data ?? []).forEach((v) => grouped.set(v.category, [...(grouped.get(v.category) ?? []), v]));

  const processingTime = cvResult?.processing_time ?? cvResult?.processing_time_seconds;
  const totalVehicles = cvResult?.total_vehicles ?? cvResult?.total_vehicles_logged;

  return (
    <div className="max-w-4xl">
      <PageHeader title="Issue Challan" subtitle="1. Look up vehicle · 2. Select violation · 3. Confirm & issue" />

      {/* ── Optional: CV video pipeline ──────────────────────────────────── */}
      <section className="mb-4 rounded-lg border bg-card">
        <button
          type="button"
          className="flex w-full items-center justify-between p-4 text-left"
          onClick={() => setShowPipeline((p) => !p)}
        >
          <span className="flex items-center gap-2 font-semibold">
            <Video size={18} className="text-primary" />
            Speed Detection via Video Pipeline
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Optional</span>
          </span>
          {showPipeline ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showPipeline && (
          <div className="border-t p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload traffic footage to auto-detect speeding vehicles and plates. The pipeline API must be running on port 8000.
            </p>
            <form className="flex flex-wrap items-end gap-3" onSubmit={processVideo}>
              <div className="flex-1 min-w-60">
                <Label htmlFor="traffic-video">Traffic video (MP4 / AVI)</Label>
                <Input
                  id="traffic-video"
                  type="file"
                  accept="video/mp4,video/x-msvideo,.mp4,.avi"
                  className="mt-1"
                  onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
                  disabled={isProcessing}
                  required
                />
              </div>
              <Button type="submit" disabled={!video || isProcessing} variant="outline">
                {isProcessing ? "Processing…" : "Run detection"}
              </Button>
            </form>

            {cvError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{cvError}</p>
            )}

            {cvResult && (
              <div className="space-y-3">
                <div className="rounded-md bg-muted/40 p-3 text-sm">
                  <p className="font-medium">Analysis complete — Job {cvResult.job_id}</p>
                  <p className="text-muted-foreground">
                    {totalVehicles ?? cvResult.incidents.length} vehicles · {processingTime ?? "—"} s · threshold {cvResult.speed_threshold} km/h
                  </p>
                  <a
                    className="mt-2 inline-block text-xs font-medium text-primary underline"
                    href={`${PIPELINE_API_URL}${cvResult.output_video_url}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open annotated video ↗
                  </a>
                </div>
                <div className="overflow-x-auto rounded-md border bg-card">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="p-2">ID</th>
                        <th className="p-2">Plate</th>
                        <th className="p-2">Speed</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cvResult.incidents.map((incident) => (
                        <tr key={incident.vehicle_id} className="border-b last:border-0">
                          <td className="p-2 font-mono">{incident.vehicle_id}</td>
                          <td className="p-2 font-mono">{incident.plate}</td>
                          <td className="p-2">{incident.speed} km/h</td>
                          <td className="p-2">{incident.class_name}</td>
                          <td className="p-2">
                            <span className={incident.overspeed ? "text-destructive font-semibold" : "text-muted-foreground"}>
                              {incident.overspeed ? "⚠ Overspeed" : "OK"}
                            </span>
                          </td>
                          <td className="p-2">
                            {incident.plate && incident.plate !== "—" && (
                              <button
                                type="button"
                                className="text-xs text-primary underline"
                                onClick={() => { setReg(incident.plate); setShowPipeline(false); }}
                              >
                                Use plate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Step 1: Vehicle lookup ───────────────────────────────────────── */}
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

      {/* ── Step 2: Violation & location ────────────────────────────────── */}
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

      {/* ── Step 3: Confirm & issue ──────────────────────────────────────── */}
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
