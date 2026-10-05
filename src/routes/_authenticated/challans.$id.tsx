import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, CreditCard, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, Loading, EmptyState } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { inr, fmtDate, fmtDateTime, labelize, errMsg } from "@/lib/format";
import { downloadReceipt } from "@/lib/receipt";
import { EvidencePanel } from "@/components/EvidencePanel";

export const Route = createFileRoute("/_authenticated/challans/$id")({
  head: () => ({ meta: [{ title: "Challan Details ΓÇö e-Challan" }] }),
  component: ChallanDetail,
});

const ATTACH_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4"];
const ATTACH_MAX = 10 * 1024 * 1024;
async function openAttachment(path: string) {
  const { data, error } = await supabase.storage.from("evidence").createSignedUrl(path, 300);
  if (error || !data) { toast.error("Could not open file"); return; }
  window.open(data.signedUrl, "_blank", "noopener");
}

const GROUNDS = ["Incorrect vehicle number", "Incorrect location", "Duplicate challan", "Evidence issue", "Signage concern", "Vehicle not present", "Other"];

function ChallanDetail() {
  const { id } = Route.useParams();
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [payOpen, setPayOpen] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [method, setMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");
  const [ground, setGround] = useState(GROUNDS[0]!);
  const [explanation, setExplanation] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const q = useQuery({
    queryKey: ["challan", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challans")
        .select("*,vehicles(reg_no,vehicle_type,make,model),traffic_violations(name,code,category,description,why_exists),traffic_rules(legal_act,section,source,is_sample),profiles!challans_officer_id_fkey(full_name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      const [pay, appeals, evidence] = await Promise.all([
        supabase.from("payments").select("*").eq("challan_id", id).order("paid_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("appeals").select("*,appeal_events(status,note,created_at)").eq("challan_id", id).order("created_at", { ascending: false }),
        supabase.from("challan_evidence").select("id,file_name,file_type,sha256,storage_path,created_at").eq("challan_id", id),
      ]);
      return { c: data, payment: pay.data, appeals: appeals.data ?? [], evidence: evidence.data ?? [] };
    },
  });

  if (q.isLoading) return <Loading />;
  const c = q.data?.c;
  if (!c) return <EmptyState title="Challan not found" hint="It may not exist or you may not have access." />;
  const { payment, appeals, evidence } = q.data!;
  const isOwner = c.owner_id === user.id;
  const payable = isOwner && ["PENDING", "OVERDUE", "ESCALATED"].includes(c.status);
  const disputable = isOwner && ["PENDING", "OVERDUE"].includes(c.status);
  const legal = c.traffic_rules ? `${c.traffic_rules.legal_act}, Sec ${c.traffic_rules.section}` : "ΓÇö";

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["challan", id] });
    qc.invalidateQueries({ queryKey: ["challans"] });
    qc.invalidateQueries({ queryKey: ["payments"] });
  };

  async function pay() {
    setBusy(true);
    const { error } = await supabase.rpc("pay_challan", { _challan_id: id, _method: method, _idempotency_key: `${id}-${crypto.randomUUID()}` });
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Payment successful");
    setPayOpen(false);
    refresh();
  }

  async function appeal() {
    const text = explanation.trim();
    if (text.length < 20) { toast.error("Please explain in at least 20 characters"); return; }
    let path: string | undefined;
    if (file) {
      if (!ATTACH_TYPES.includes(file.type)) { toast.error("Only JPG, PNG, WEBP, PDF or MP4 files"); return; }
      if (file.size > ATTACH_MAX) { toast.error("File must be under 10 MB"); return; }
    }
    setBusy(true);
    if (file) {
      path = `appeals/${user.id}/${id}-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_").slice(-80)}`;
      const up = await supabase.storage.from("evidence").upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) { setBusy(false); toast.error(errMsg(up.error)); return; }
    }
    const { error } = await supabase.rpc("submit_appeal", { _challan_id: id, _ground: ground, _explanation: text.slice(0, 2000), ...(path ? { _attachment_path: path } : {}) });
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Appeal submitted");
    setAppealOpen(false);
    setFile(null);
    refresh();
  }

  const receipt = () =>
    downloadReceipt({
      challan_no: c.challan_no, reg_no: c.vehicles?.reg_no ?? "", violation: c.traffic_violations?.name ?? "",
      legal, location: c.location_text, issued_at: c.issued_at, amount: c.amount, status: c.status,
      payment: payment ? { transaction_id: payment.transaction_id, method: payment.method, paid_at: payment.paid_at, amount: payment.amount } : null,
    });

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={c.challan_no}
        subtitle={`Issued ${fmtDateTime(c.issued_at)}`}
        actions={
          <>
            {payable && <Button onClick={() => setPayOpen(true)}><CreditCard size={16} /> Pay {inr(c.amount)}</Button>}
            {disputable && <Button variant="outline" onClick={() => setAppealOpen(true)}><Scale size={16} /> Dispute</Button>}
            <Button variant="outline" onClick={receipt}><Download size={16} /> {payment ? "Receipt PDF" : "Challan PDF"}</Button>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold uppercase">Details</h2><StatusBadge status={c.status} /></div>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Vehicle", <Link key="v" to="/vehicles/$id" params={{ id: c.vehicle_id }} className="font-mono font-semibold text-primary">{c.vehicles?.reg_no}</Link>],
                ["Vehicle type", `${labelize(c.vehicles?.vehicle_type ?? "")} ┬╖ ${c.vehicles?.make} ${c.vehicles?.model}`],
                ["Violation", `${c.traffic_violations?.code} ΓÇö ${c.traffic_violations?.name}`],
                ["Location", c.location_text],
                ["Officer", c.profiles?.full_name || "Automated / ΓÇö"],
                ["Due date", fmtDate(c.due_date)],
                ["Base fine", inr(c.base_fine)],
                ["Additional penalty", inr(c.additional_penalty)],
              ].map(([k, v]) => (
                <div key={String(k)}><dt className="text-xs uppercase text-muted-foreground">{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            <p className="mt-4 font-display text-4xl font-bold">{inr(c.amount)}</p>
            {c.remarks && <p className="mt-2 text-sm text-muted-foreground">Remarks: {c.remarks}</p>}
          </section>
          <section className="rounded-lg border bg-card p-5">
            <h2 className="text-xl font-bold uppercase">Why this fine?</h2>
            <p className="mt-2 text-sm">{c.traffic_violations?.description}</p>
            <p className="mt-2 text-sm text-muted-foreground">{c.traffic_violations?.why_exists}</p>
            <p className="mt-3 text-sm">Legal basis: <b>{legal}</b></p>
            {c.traffic_rules?.source && <p className="text-xs text-muted-foreground">Source: {c.traffic_rules.source}{c.traffic_rules.is_sample ? " (sample amount)" : ""}</p>}
          </section>
          {appeals.length > 0 && (
            <section className="rounded-lg border bg-card p-5">
              <h2 className="text-xl font-bold uppercase">Appeal</h2>
              {appeals.map((a) => (
                <div key={a.id} className="mt-3 text-sm">
                  <div className="flex items-center justify-between"><b>{a.ground}</b><StatusBadge status={a.status} /></div>
                  <p className="mt-1 text-muted-foreground">{a.explanation}</p>
                  {a.attachment_path && <button onClick={() => openAttachment(a.attachment_path!)} className="mt-1 text-primary underline">View attachment</button>}
                  {a.decision_notes && <p className="mt-1">Decision: {a.decision_notes}</p>}
                  <ol className="mt-2 border-l pl-4">
                    {a.appeal_events.sort((x, y) => x.created_at.localeCompare(y.created_at)).map((e, i) => (
                      <li key={i} className="mb-1"><StatusBadge status={e.status} /> <span className="text-xs text-muted-foreground">{fmtDateTime(e.created_at)} ┬╖ {e.note}</span></li>
                    ))}
                  </ol>
                </div>
              ))}
            </section>
          )}
        </div>
        <div className="space-y-4">
          <section className="rounded-lg border bg-card p-5 text-sm">
            <h2 className="text-xl font-bold uppercase">Payment</h2>
            {payment ? (
              <div className="mt-2 space-y-1">
                <p className="font-mono text-xs">{payment.transaction_id}</p>
                <p>{payment.method} ┬╖ {inr(payment.amount)}</p>
                <p className="text-muted-foreground">{fmtDateTime(payment.paid_at)}</p>
              </div>
            ) : <p className="mt-2 text-muted-foreground">Not paid yet.</p>}
          </section>
          <EvidencePanel challanId={c.id} evidence={evidence} canUpload={role !== "citizen"} onDone={() => qc.invalidateQueries({ queryKey: ["challan", id] })} />
          <section className="rounded-lg border bg-card p-5 text-sm">
            <h2 className="text-xl font-bold uppercase">Verify</h2>
            <Link to="/verify/$challanNo" params={{ challanNo: c.challan_no }} className="mt-2 block text-primary underline">Public verification page</Link>
          </section>
        </div>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Pay {inr(c.amount)}</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Demo payment ΓÇö no real money is charged.</p>
          <div className="grid grid-cols-3 gap-2">
            {(["UPI", "CARD", "NETBANKING"] as const).map((m) => (
              <Button key={m} variant={method === m ? "default" : "outline"} onClick={() => setMethod(m)}>{labelize(m)}</Button>
            ))}
          </div>
          <Button disabled={busy} onClick={pay}>{busy ? "ProcessingΓÇª" : `Confirm payment`}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={appealOpen} onOpenChange={setAppealOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dispute {c.challan_no}</DialogTitle></DialogHeader>
          <Label>Ground</Label>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={ground} onChange={(e) => setGround(e.target.value)}>
            {GROUNDS.map((g) => <option key={g}>{g}</option>)}
          </select>
          <Label>Explanation</Label>
          <Textarea rows={5} maxLength={2000} value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Describe why this challan is incorrect (min 20 characters)" />
          <Label>Supporting photo, video or document (optional)</Label>
          <input type="file" accept={ATTACH_TYPES.join(",")} className="text-sm"
            onChange={(e) => { const f = e.target.files?.[0] ?? null; if (f && (!ATTACH_TYPES.includes(f.type) || f.size > ATTACH_MAX)) { toast.error("JPG, PNG, WEBP, PDF or MP4 under 10 MB only"); e.target.value = ""; setFile(null); return; } setFile(f); }} />
          <p className="text-xs text-muted-foreground">Max 10 MB. Only you and reviewing officers can view it.</p>
          <Button disabled={busy} onClick={appeal}>{busy ? "SubmittingΓÇª" : "Submit appeal"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
