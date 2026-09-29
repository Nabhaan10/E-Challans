import { cn } from "@/lib/utils";
import { labelize } from "@/lib/format";

const styles: Record<string, string> = {
  PENDING: "bg-warning/20 text-warning-foreground border-warning/50",
  PAID: "bg-success/15 text-success border-success/40",
  DISPUTED: "bg-info/15 text-info border-info/40",
  UNDER_REVIEW: "bg-info/15 text-info border-info/40",
  RESOLVED: "bg-muted text-muted-foreground border-border",
  OVERDUE: "bg-destructive/15 text-destructive border-destructive/40",
  ESCALATED: "bg-destructive text-destructive-foreground border-destructive",
  SUBMITTED: "bg-warning/20 text-warning-foreground border-warning/50",
  APPROVED: "bg-success/15 text-success border-success/40",
  REJECTED: "bg-destructive/15 text-destructive border-destructive/40",
  VALID: "bg-success/15 text-success border-success/40",
  EXPIRING_SOON: "bg-warning/20 text-warning-foreground border-warning/50",
  EXPIRED: "bg-destructive/15 text-destructive border-destructive/40",
  UNKNOWN: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide",
        styles[status] ?? styles.UNKNOWN,
        className,
      )}
    >
      {labelize(status)}
    </span>
  );
}
