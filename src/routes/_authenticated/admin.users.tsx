import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RequireRole } from "@/components/AppShell";
import { PageHeader, Loading, EmptyState } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtDate, errMsg } from "@/lib/format";
import type { Role } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "User Management ΓÇö e-Challan" }] }),
  component: () => (
    <RequireRole roles={["admin"]}>
      <UsersPage />
    </RequireRole>
  ),
});

function UsersPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [roleF, setRoleF] = useState<"" | Role>("");
  const q = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [p, r, o] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,phone,created_at,is_demo").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id,role"),
        supabase.from("officers").select("*"),
      ]);
      const roles = new Map<string, Role[]>();
      (r.data ?? []).forEach((x) => roles.set(x.user_id, [...(roles.get(x.user_id) ?? []), x.role as Role]));
      const officers = new Map((o.data ?? []).map((x: Record<string, unknown>) => [String(x["user_id"] ?? x["id"]), x]));
      return (p.data ?? []).map((u) => {
        const list = roles.get(u.id) ?? [];
        const role: Role = list.includes("admin") ? "admin" : list.includes("officer") ? "officer" : "citizen";
        const off = officers.get(u.id) as { badge_no?: string; station?: string } | undefined;
        return { ...u, role, badge: off?.badge_no ?? "", station: off?.station ?? "" };
      });
    },
  });

  async function setRole(userId: string, role: Role) {
    let badge: string | undefined, station: string | undefined;
    if (role === "officer") {
      badge = prompt("Badge number (e.g. KL-TP-1234)") ?? undefined;
      station = prompt("Police station") ?? undefined;
    }
    const { error } = await supabase.rpc("admin_set_role", { _user_id: userId, _role: role, ...(badge ? { _badge: badge } : {}), ...(station ? { _station: station } : {}) });
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Role updated");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  if (q.isLoading) return <Loading />;
  const s = filter.toLowerCase();
  const rows = (q.data ?? []).filter(
    (u) => (!roleF || u.role === roleF) && (!s || `${u.full_name} ${u.email} ${u.phone}`.toLowerCase().includes(s)),
  );
  return (
    <div>
      <PageHeader title="Users" subtitle={`${q.data?.length ?? 0} registered accounts`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input placeholder="Search name, email, phone" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs" />
        <select value={roleF} onChange={(e) => setRoleF(e.target.value as Role | "")} className="h-9 rounded-md border bg-background px-2 text-sm">
          <option value="">All roles</option>
          <option value="citizen">Citizens</option>
          <option value="officer">Officers</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      {!rows.length ? <EmptyState title="No users match" /> : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Name</th><th className="p-3">Contact</th><th className="p-3">Role</th><th className="p-3">Officer info</th><th className="p-3">Joined</th><th className="p-3">Change role</th></tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="p-3 font-medium">{u.full_name}{u.is_demo && <span className="ml-2 rounded bg-muted px-1.5 text-[10px] uppercase">demo</span>}</td>
                  <td className="p-3 text-muted-foreground">{u.email}<br />{u.phone}</td>
                  <td className="p-3 capitalize">{u.role}</td>
                  <td className="p-3 text-xs text-muted-foreground">{u.badge}{u.station && ` ┬╖ ${u.station}`}</td>
                  <td className="p-3 text-muted-foreground">{fmtDate(u.created_at)}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {(["citizen", "officer", "admin"] as Role[]).filter((r) => r !== u.role).map((r) => (
                        <Button key={r} size="sm" variant="outline" className="capitalize" onClick={() => setRole(u.id, r)}>{r}</Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
