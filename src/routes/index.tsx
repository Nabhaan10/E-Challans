import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, BookOpen, FileCheck2, Fingerprint, Scale, Wallet, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "e-Challan — Digital Traffic Violation Management for India" },
      { name: "description", content: "A unified platform for digital challans, traffic-rule management, payments, appeals and traffic intelligence." },
      { property: "og:title", content: "e-Challan — Digital Traffic Violation Management" },
      { property: "og:description", content: "Digital challans, rule engine, secure payments, evidence integrity and analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: FileCheck2, title: "Digital Challans", text: "Officers issue challans on the spot with a unique CH-number and instant citizen notification." },
  { icon: BookOpen, title: "Traffic Rule Engine", text: "Fines are resolved from the configured rule database — officers never type an amount." },
  { icon: Wallet, title: "Secure Payments", text: "UPI, card and net-banking flow with idempotent transactions and PDF receipts." },
  { icon: Fingerprint, title: "Evidence Management", text: "Every photo is SHA-256 fingerprinted and re-verified on view." },
  { icon: Scale, title: "Dispute Resolution", text: "Citizens appeal with a guided assistant; officers review with full history." },
  { icon: BarChart3, title: "Traffic Analytics", text: "Hotspot maps, revenue trends and violation categories from live data." },
];

function Landing() {
  const [no, setNo] = useState("");
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-full border-4 border-destructive bg-card font-display text-sm font-bold text-foreground">
              e₹
            </span>
            <span className="font-display text-2xl font-bold uppercase tracking-wide">e-Challan</span>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/auth" search={{ mode: "register" }}>Register</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-20 pt-12 md:grid-cols-[1.3fr_1fr] md:pt-20">
          <div>
            <p className="mb-4 inline-block rounded border border-accent/60 px-2 py-1 font-mono text-xs uppercase tracking-widest text-accent">
              Government of India · Road Transport
            </p>
            <h1 className="text-5xl font-extrabold uppercase leading-[0.95] md:text-7xl">
              Digital Traffic Violation Management
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/80">
              A unified platform for digital challans, traffic-rule management, payments, appeals and traffic intelligence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/auth">Login</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/auth" search={{ mode: "register" }}>Register as citizen</Link>
              </Button>
            </div>
          </div>
          <div className="self-center rounded-lg border-2 border-accent bg-card p-6 text-card-foreground shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <QrCode className="text-primary" />
              <h2 className="text-2xl font-bold uppercase">Verify a challan</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">Enter the challan number printed on your notice or scan its QR code.</p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (no.trim()) navigate({ to: "/verify/$challanNo", params: { challanNo: no.trim().toUpperCase() } });
              }}
            >
              <Input value={no} onChange={(e) => setNo(e.target.value)} placeholder="CH-123456" className="font-mono" />
              <Button type="submit">Verify</Button>
            </form>
            <div className="mt-6 rounded-md bg-muted p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Demo accounts (password: Demo@1234)</p>
              <p className="mt-1 font-mono">officer1@demo.in · citizen1@demo.in · admin@demo.in</p>
            </div>
          </div>
        </div>
        <div className="hazard h-3" />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-4xl font-bold uppercase">One system, the full challan lifecycle</h2>
        <div className="road-stripe mt-3 w-40" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-lg border bg-card p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-md bg-primary text-accent">
                <f.icon />
              </div>
              <h3 className="text-2xl font-bold uppercase">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground">
          Academic demonstration project. Traffic rules shown are sample data and are not officially verified legal information.
        </div>
      </footer>
    </div>
  );
}
