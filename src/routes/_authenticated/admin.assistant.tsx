import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Send } from "lucide-react";
import { askData } from "@/lib/assistant.functions";
import { RequireRole } from "@/components/AppShell";
import { PageHeader } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/assistant")({
  head: () => ({ meta: [{ title: "Data Assistant ΓÇö e-Challan" }] }),
  component: () => (
    <RequireRole roles={["admin"]}>
      <Assistant />
    </RequireRole>
  ),
});

type Msg = { role: "user" | "assistant"; content: string };
const SUGGESTIONS = [
  "Which violation brings in the most fines?",
  "What share of challans is still unpaid?",
  "Which locations are the worst hotspots?",
  "How has revenue changed month by month?",
];

function Assistant() {
  const ask = useServerFn(askData);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(q: string) {
    if (!q.trim() || busy) return;
    const next = [...msgs, { role: "user" as const, content: q.trim() }];
    setMsgs(next);
    setText("");
    setBusy(true);
    try {
      const r = await ask({ data: { messages: next } });
      setMsgs([...next, { role: "assistant", content: r.reply ?? `ΓÜá ${r.error}` }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "ΓÜá Something went wrong. Try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Data Assistant" subtitle="Ask questions about challans, payments and appeals in plain language." />
      <div className="flex min-h-[420px] flex-col gap-3 rounded-lg border bg-card p-4">
        {!msgs.length && (
          <div className="grid gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-md border p-3 text-left text-sm hover:bg-muted">{s}</button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-lg p-3 text-sm ${m.role === "user" ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted"}`}>
            {m.content}
          </div>
        ))}
        {busy && <div className="self-start animate-pulse rounded-lg bg-muted p-3 text-sm">Analysing dataΓÇª</div>}
      </div>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
          placeholder="e.g. How many helmet violations were issued last month?"
          rows={2}
        />
        <Button type="submit" disabled={busy || !text.trim()}><Send size={16} /></Button>
      </form>
    </div>
  );
}
