import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sha256Hex } from "@/lib/crypto";
import { errMsg } from "@/lib/format";
import { Button } from "@/components/ui/button";

type Ev = { id: string; file_name: string; file_type: string; sha256: string; storage_path: string };
const MAX = 10 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4"];

export function EvidencePanel({ challanId, evidence, canUpload, onDone }: { challanId: string; evidence: Ev[]; canUpload: boolean; onDone: () => void }) {
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!TYPES.includes(file.type)) { toast.error("Only JPG, PNG, WEBP, PDF or MP4 files"); return; }
    if (file.size > MAX) { toast.error("File must be under 10 MB"); return; }
    setBusy(true);
    try {
      const hash = await sha256Hex(await file.arrayBuffer());
      const path = `${challanId}/${hash.slice(0, 16)}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const up = await supabase.storage.from("evidence").upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;
      const { error } = await supabase.rpc("add_evidence", {
        _challan_id: challanId, _file_name: file.name, _file_size: file.size, _file_type: file.type, _sha256: hash, _storage_path: path,
      });
      if (error) throw error;
      toast.success("Evidence attached");
      onDone();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function open(e: Ev) {
    const { data, error } = await supabase.storage.from("evidence").createSignedUrl(e.storage_path, 300);
    if (error || !data) { toast.error("Could not open file"); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <section className="rounded-lg border bg-card p-5 text-sm">
      <h2 className="text-xl font-bold uppercase">Evidence</h2>
      {evidence.length ? evidence.map((e) => (
        <div key={e.id} className="mt-2">
          <button onClick={() => open(e)} className="text-primary underline">{e.file_name}</button>
          <p className="break-all font-mono text-[10px] text-muted-foreground">SHA-256 {e.sha256}</p>
        </div>
      )) : <p className="mt-2 text-muted-foreground">No evidence attached.</p>}
      {canUpload && (
        <Button asChild variant="outline" size="sm" className="mt-3" disabled={busy}>
          <label className="cursor-pointer">
            {busy ? "Uploading…" : "Attach photo / file"}
            <input type="file" accept={TYPES.join(",")} className="hidden" disabled={busy}
              onChange={(ev) => { const f = ev.target.files?.[0]; if (f) upload(f); ev.target.value = ""; }} />
          </label>
        </Button>
      )}
    </section>
  );
}
