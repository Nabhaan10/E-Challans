import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, EmptyState, Loading } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { ago } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — e-Challan" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications", user.id, "all"],
    queryFn: async () =>
      (await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200)).data ?? [],
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["unread"] });
  };
  async function markAll() {
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    refresh();
  }
  async function markOne(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    refresh();
  }
  const rows = q.data ?? [];
  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${rows.filter((n) => !n.read).length} unread`}
        actions={<Button variant="outline" onClick={markAll}>Mark all read</Button>}
      />
      {q.isLoading ? <Loading /> : !rows.length ? <EmptyState title="No notifications yet" /> : (
        <div className="divide-y rounded-lg border bg-card">
          {rows.map((n) => (
            <div key={n.id} className={`flex items-start gap-3 p-4 ${n.read ? "" : "bg-muted/40"}`}>
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-destructive"}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${n.read ? "" : "font-semibold"}`}>{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{ago(n.created_at)} · {n.type}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {n.link && <Button asChild size="sm" variant="outline" onClick={() => markOne(n.id)}><Link to={n.link}>Open</Link></Button>}
                {!n.read && <Button size="sm" variant="ghost" onClick={() => markOne(n.id)}>Mark read</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
