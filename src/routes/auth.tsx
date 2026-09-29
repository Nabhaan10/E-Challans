import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadSession, homeFor } from "@/lib/auth";
import { errMsg } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "register" } => (s['mode'] === "register" ? { mode: "register" } : {}),
  head: () => ({
    meta: [
      { title: "Sign in — e-Challan" },
      { name: "description", content: "Sign in or register for the Digital Traffic Violation Management System." },
      { property: "og:title", content: "Sign in — e-Challan" },
      { property: "og:description", content: "Access your challans, vehicles and appeals." },
    ],
  }),
  component: AuthPage,
});

const regSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().regex(/^[0-9+ ]{10,15}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const [tab, setTab] = useState<"login" | "register">(mode ?? "login");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")).trim(),
      password: String(f.get("password")),
    });
    if (error) {
      setBusy(false);
      { toast.error(error.message); return; }
    }
    const s = await loadSession();
    await supabase.rpc("log_event", { _action: "LOGIN", _entity: "user", _entity_id: s?.user.id ?? null });
    setBusy(false);
    navigate({ to: homeFor(s?.role ?? "citizen") });
  }

  async function register(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = regSchema.safeParse(f);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: window.location.origin + "/auth",
          data: { full_name: parsed.data.full_name, phone: parsed.data.phone },
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  function fill(email: string) {
    const el = document.getElementById("email") as HTMLInputElement | null;
    const pw = document.getElementById("password") as HTMLInputElement | null;
    if (el && pw) {
      el.value = email;
      pw.value = "Demo@1234";
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground md:flex">
        <Link to="/" className="font-display text-2xl font-bold uppercase">e-Challan</Link>
        <div>
          <h1 className="text-5xl font-extrabold uppercase leading-none">Safer roads,<br />transparent fines.</h1>
          <p className="mt-4 max-w-sm text-primary-foreground/70">Every challan is backed by a configured rule, timestamped evidence and a full audit trail.</p>
        </div>
        <div className="hazard -mx-10 -mb-10 h-3" />
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex rounded-md border p-1">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded px-3 py-2 text-sm font-semibold uppercase ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {t === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>
          {tab === "login" ? (
            <form onSubmit={login} className="space-y-4">
              <h2 className="text-3xl font-bold uppercase">Sign in</h2>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required autoComplete="current-password" />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
              <Link to="/forgot-password" className="block text-center text-sm text-primary underline">Forgot password?</Link>
              <div className="rounded-md border border-dashed p-3 text-xs">
                <p className="mb-2 font-semibold">Demo accounts — click to fill</p>
                <div className="flex flex-wrap gap-2">
                  {["officer1@demo.in", "citizen1@demo.in", "admin@demo.in"].map((e) => (
                    <button type="button" key={e} onClick={() => fill(e)} className="rounded bg-muted px-2 py-1 font-mono hover:bg-secondary">{e}</button>
                  ))}
                </div>
              </div>
            </form>
          ) : sent ? (
            <div className="space-y-3 rounded-lg border bg-card p-6">
              <h2 className="text-2xl font-bold uppercase">Check your email</h2>
              <p className="text-sm text-muted-foreground">We sent a confirmation link. Click it to activate your citizen account, then sign in.</p>
            </div>
          ) : (
            <form onSubmit={register} className="space-y-4">
              <h2 className="text-3xl font-bold uppercase">Citizen registration</h2>
              <div className="space-y-1.5"><Label htmlFor="full_name">Full name</Label><Input id="full_name" name="full_name" required /></div>
              <div className="space-y-1.5"><Label htmlFor="phone">Mobile number</Label><Input id="phone" name="phone" required placeholder="+91 98xxxxxxxx" /></div>
              <div className="space-y-1.5"><Label htmlFor="remail">Email</Label><Input id="remail" name="email" type="email" required /></div>
              <div className="space-y-1.5"><Label htmlFor="rpw">Password</Label><Input id="rpw" name="password" type="password" required minLength={8} /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
              <p className="text-xs text-muted-foreground">Officer and admin accounts are assigned by an administrator.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
