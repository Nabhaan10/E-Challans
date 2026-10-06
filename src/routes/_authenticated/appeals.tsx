import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, Loading, EmptyState } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, ExternalLink } from "lucide-react";
import { fmtDateTime, inr, errMsg } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/appeals")({
  head: () => ({ meta: [{ title: "Appeals — e-Challan" }] }),
  component: AppealsPage,
});

async function openAttachment(path: string) {
  try {
    const { data, error } = await supabase.storage.from("evidence").createSignedUrl(path, 300);
    if (error || !data?.signedUrl) {
      toast.error(error?.message || "Could not open file attachment");
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    toast.error(errMsg(err));
  }
}

function getAttachmentLabel(path: string) {
  const filePart = path.split("/").pop() || "evidence";
  const parts = filePart.split("-");
  return parts.length >= 3 ? parts.slice(2).join("-") : filePart;
}

function AppealsPage() {
  const { role } = useAuth();
  const staff = role !== "citizen";
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { data, isLoading } = useQuery({
    queryKey: ["appeals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appeals")
        .select("id,ground,explanation,status,decision_notes,created_at,challan_id,attachment_path,challans(challan_no,amount,vehicles(reg_no))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function act(id: string, action: "start_review" | "approve" | "reject") {
    const { error } = await supabase.rpc("review_appeal", { _appeal_id: id, _action: action, ...(notes[id]?.trim() ? { _notes: notes[id]!.trim() } : {}) });
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Appeal updated");
    qc.invalidateQueries({ queryKey: ["appeals"] });
    qc.invalidateQueries({ queryKey: ["challans"] });
  }

  if (isLoading) return <Loading />;
  const rows = data ?? [];
  return (
    <div className="max-w-4xl">
      <PageHeader title="Appeals" subtitle={staff ? "Review citizen disputes" : "Track your disputes"} />
      {!rows.length && <EmptyState title="No appeals" {...(staff ? {} : { hint: "Open a pending challan and choose Dispute." })} />}
      <div className="space-y-3">
        {rows.map((a) => {
          const open = a.status === "SUBMITTED" || a.status === "UNDER_REVIEW";
          return (
            <div key={a.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link to="/challans/$id" params={{ id: a.challan_id }} className="font-mono font-semibold text-primary">
                  {a.challans?.challan_no} · {a.challans?.vehicles?.reg_no} · {inr(a.challans?.amount)}
                </Link>
                <StatusBadge status={a.status} />
              </div>
              <p className="mt-2 text-sm font-semibold">{a.ground}</p>
              <p className="text-sm text-muted-foreground">{a.explanation}</p>
              {a.attachment_path && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs font-medium text-primary hover:bg-primary/5 hover:text-primary"
                    onClick={() => openAttachment(a.attachment_path!)}
                  >
                    <Paperclip size={14} className="text-muted-foreground" />
                    <span>Evidence: {getAttachmentLabel(a.attachment_path)}</span>
                    <ExternalLink size={12} className="opacity-70" />
                  </Button>
                </div>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Filed {fmtDateTime(a.created_at)}</p>
              {a.decision_notes && <p className="mt-2 text-sm">Decision: {a.decision_notes}</p>}
              {staff && open && (
                <div className="mt-3 space-y-2">
                  <Textarea rows={2} maxLength={1000} placeholder="Decision notes (required to approve/reject)" value={notes[a.id] ?? ""} onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })} />
                  <div className="flex gap-2">
                    {a.status === "SUBMITTED" && <Button size="sm" variant="outline" onClick={() => act(a.id, "start_review")}>Start review</Button>}
                    <Button size="sm" onClick={() => act(a.id, "approve")}>Approve (waive)</Button>
                    <Button size="sm" variant="destructive" onClick={() => act(a.id, "reject")}>Reject</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
