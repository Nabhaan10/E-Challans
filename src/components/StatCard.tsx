import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "warning" | "success" | "danger" | "info";
}) {
  const bar = {
    default: "bg-primary",
    warning: "bg-warning",
    success: "bg-success",
    danger: "bg-destructive",
    info: "bg-info",
  }[tone];
  return (
    <div className="relative overflow-hidden rounded-lg border bg-card p-4 shadow-sm">
      <div className={cn("absolute inset-y-0 left-0 w-1", bar)} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold uppercase text-foreground md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-card/50 p-8 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}
