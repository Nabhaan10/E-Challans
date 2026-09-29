import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  Bell, BookOpen, Car, ClipboardList, FileWarning, Gauge, LogOut, Map, Menu, MessageSquare,
  ScrollText, Search, Settings, ShieldCheck, Users, Wallet, X, Scale,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, homeFor, type Role } from "@/lib/auth";
import { useT, type TKey, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type NavItem = { to: string; key: TKey; icon: ReactNode; roles: Role[] };
const NAV: NavItem[] = [
  { to: "/citizen", key: "dashboard", icon: <Gauge size={18} />, roles: ["citizen"] },
  { to: "/officer", key: "dashboard", icon: <Gauge size={18} />, roles: ["officer"] },
  { to: "/admin", key: "dashboard", icon: <Gauge size={18} />, roles: ["admin"] },
  { to: "/officer/issue", key: "issue", icon: <FileWarning size={18} />, roles: ["officer", "admin"] },
  { to: "/challans", key: "challans", icon: <ClipboardList size={18} />, roles: ["citizen", "officer", "admin"] },
  { to: "/vehicles", key: "vehicles", icon: <Car size={18} />, roles: ["citizen", "officer", "admin"] },
  { to: "/appeals", key: "appeals", icon: <Scale size={18} />, roles: ["citizen", "officer", "admin"] },
  { to: "/rules", key: "rules", icon: <BookOpen size={18} />, roles: ["citizen", "officer", "admin"] },
  { to: "/admin/map", key: "map", icon: <Map size={18} />, roles: ["officer", "admin"] },
  { to: "/admin/payments", key: "payments", icon: <Wallet size={18} />, roles: ["admin"] },
  { to: "/admin/users", key: "users", icon: <Users size={18} />, roles: ["admin"] },
  { to: "/admin/rules", key: "settings", icon: <Settings size={18} />, roles: ["admin"] },
  { to: "/admin/audit", key: "audit", icon: <ScrollText size={18} />, roles: ["admin"] },
  { to: "/admin/assistant", key: "assistant", icon: <MessageSquare size={18} />, roles: ["admin"] },
  { to: "/search", key: "search", icon: <Search size={18} />, roles: ["officer", "admin", "citizen"] },
];

export function AppShell() {
  const { role, profile, user } = useAuth();
  const { t, lang, setLang } = useT();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: unread = 0 } = useQuery({
    queryKey: ["unread", user.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  async function signOut() {
    await supabase.rpc("log_event", { _action: "LOGOUT", _entity: "user", _entity_id: user.id });
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const items = NAV.filter((n) => n.roles.includes(role));
  const roleLabel = { admin: "Administrator", officer: "Police Officer", citizen: "Citizen" }[role];

  const sidebar = (
    <nav className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5">
        <Link to={homeFor(role)} className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-full border-4 border-destructive bg-card font-display text-sm font-bold text-foreground">
            e₹
          </span>
          <div>
            <p className="font-display text-xl font-bold uppercase leading-none tracking-wide">e-Challan</p>
            <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Traffic Violation MS</p>
          </div>
        </Link>
      </div>
      <div className="road-stripe mx-5 mb-4 opacity-70" />
      <div className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {items.map((n) => (
          <Link
            key={n.to + n.key}
            to={n.to}
            onClick={() => setOpen(false)}
            activeOptions={{ exact: n.key === "dashboard" }}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "!bg-sidebar-primary !text-sidebar-primary-foreground" }}
          >
            {n.icon}
            {n.to === "/admin/rules" ? "Rules & Settings" : t(n.key)}
          </Link>
        ))}
      </div>
      <div className="border-t border-sidebar-border p-4">
        <p className="truncate text-sm font-semibold">{profile.full_name}</p>
        <p className="flex items-center gap-1 text-xs text-sidebar-foreground/60">
          <ShieldCheck size={12} /> {roleLabel}
        </p>
        <button
          onClick={signOut}
          className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
        >
          <LogOut size={16} /> {t("signout")}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64">{sidebar}</div>
          <button aria-label="Close menu" className="flex-1 bg-foreground/40" onClick={() => setOpen(false)} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card/95 px-4 py-3 backdrop-blur">
          <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            {open ? <X /> : <Menu />}
          </button>
          <form
            className="relative flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) navigate({ to: "/search", search: { q: q.trim() } });
            }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPh")}
              className="h-9 w-full max-w-md rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </form>
          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="en">EN</option>
            <option value="ml">മല</option>
            <option value="hi">हिं</option>
          </select>
          <Link to="/notifications" className="relative rounded-md p-2 hover:bg-muted" aria-label="Notifications">
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unread}
              </span>
            )}
          </Link>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { role } = useAuth();
  if (!roles.includes(role))
    return (
      <div className={cn("rounded-lg border bg-card p-8 text-center")}>
        <p className="font-display text-2xl font-bold uppercase">Access restricted</p>
        <p className="mt-2 text-sm text-muted-foreground">Your role does not have permission to view this page.</p>
      </div>
    );
  return <>{children}</>;
}
