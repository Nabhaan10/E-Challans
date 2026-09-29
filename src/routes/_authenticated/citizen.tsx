import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, IndianRupee, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { fetchChallans } from "@/lib/data";
import { StatCard, PageHeader, Loading } from "@/components/StatCard";
import { ChallanTable } from "@/components/ChallanTable";
import { StatusBadge } from "@/components/StatusBadge";
import { inr, docState, labelize, ago } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/citizen")({
  head: () => ({ meta: [{ title: "Citizen Dashboard — e-Challan" }] }),
  component: CitizenDashboard,
});

function CitizenDashboard() {
  const { user, profile } = useAuth();
  const { t } = useT();
  const challans = useQuery({ queryKey: ["challans", "mine", user.id], queryFn: () => fetchChallans() });
  const vehicles = useQuery({
    queryKey: ["vehicles", "mine", user.id],
    queryFn: async () => (await supabase.from("vehicles").select("*").eq("owner_id", user.id).order("reg_no")).data ?? [],
  });
  const notifs = useQuery({
    queryKey: ["notifications", user.id, "recent"],
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5)).data ?? [],
  });
  const appeals = useQuery({
    queryKey: ["appeals", "mine", user.id],
    queryFn: async () => (await supabase.from("appeals").select("id,status").eq("citizen_id", user.id)).data ?? [],
  });

  useEffect(() => {
    supabase.rpc("refresh_document_reminders").then(() => notifs.refetch());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = (challans.data ?? []).filter((c) => c.owner_id === user.id);
  const unpaid = rows.filter((c) => ["PENDING", "OVERDUE", "ESCALATED"].includes(c.status));
  const active = (appeals.data ?? []).filter((a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW").length;

  return (
    <div>
      <PageHeader title={`Namaskaram, ${profile.full_name.split(" ")[0]}`} subtitle="Your challans, vehicles and reminders at a glance." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("outstanding")} value={inr(unpaid.reduce((s, c) => s + c.amount, 0))} tone="danger" icon={<IndianRupee size={18} />} />
        <StatCard label={t("pending")} value={unpaid.length} tone="warning" icon={<AlertTriangle size={18} />} />
        <StatCard label={t("paid")} value={rows.filter((c) => c.status === "PAID").length} tone="success" icon={<CheckCircle2 size={18} />} />
        <StatCard label={t("activeAppeals")} value={active} tone="info" icon={<Scale size={18} />} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl font-bold uppercase">{t("recent")}</h2>
            <Link to="/challans" className="text-sm text-primary underline">View all</Link>
          </div>
          {challans.isLoading ? <Loading /> : <ChallanTable rows={rows.slice(0, 8)} empty="You have no challans. Drive safe!" />}
        </section>
        <section>
          <h2 className="mb-3 text-2xl font-bold uppercase">{t("notifications")}</h2>
          <div className="divide-y rounded-lg border bg-card">
            {(notifs.data ?? []).map((n) => (
              <Link key={n.id} to={n.link ?? "/notifications"} className="block p-3 hover:bg-muted/40">
                <p className={`text-sm ${n.read ? "" : "font-semibold"}`}>{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{ago(n.created_at)}</p>
              </Link>
            ))}
            {!notifs.data?.length && <p className="p-4 text-sm text-muted-foreground">No notifications.</p>}
          </div>
        </section>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold uppercase">{t("myVehicles")}</h2>
          <Link to="/vehicles" className="text-sm text-primary underline">Manage vehicles</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(vehicles.data ?? []).map((v) => (
            <Link key={v.id} to="/vehicles/$id" params={{ id: v.id }} className="rounded-lg border bg-card p-4 hover:shadow-md">
              <div className="inline-block rounded border-2 border-foreground bg-card px-2 py-0.5 font-mono text-lg font-bold tracking-wider">{v.reg_no}</div>
              <p className="mt-2 text-sm text-muted-foreground">{labelize(v.vehicle_type)} · {v.make} {v.model}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {([["Insurance", v.insurance_expiry], ["PUC", v.puc_expiry], ["Registration", v.registration_expiry]] as const).map(([k, d]) => {
                  const s = docState(d);
                  return (
                    <span key={k} className="flex items-center gap-1">
                      {k}: <StatusBadge status={s.state} />
                    </span>
                  );
                })}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
