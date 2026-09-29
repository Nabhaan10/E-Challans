import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ShieldX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import { inr, fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/verify/$challanNo")({
  head: ({ params }) => ({
    meta: [
      { title: `Verify ${params.challanNo} — e-Challan` },
      { name: "description", content: "Public verification of a digital traffic challan." },
      { property: "og:title", content: `Challan verification ${params.challanNo}` },
      { property: "og:description", content: "Check the authenticity and status of a traffic challan." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Verify,
});

function Verify() {
  const { challanNo } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["verify", challanNo],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("verify_challan", { _challan_no: challanNo });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  return (
    <div className="min-h-screen bg-primary px-4 py-10">
      <div className="mx-auto max-w-md overflow-hidden rounded-lg bg-card shadow-2xl">
        <div className="hazard h-2" />
        <div className="p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">e-Challan public verification</p>
          {isLoading ? (
            <div className="mt-6 h-40 animate-pulse rounded bg-muted" />
          ) : !data ? (
            <div className="mt-6 text-center">
              <ShieldX className="mx-auto text-destructive" size={48} />
              <h1 className="mt-3 text-3xl font-bold uppercase">Not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">No challan exists with number <span className="font-mono">{challanNo}</span>. It may be invalid or forged.</p>
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-center gap-3">
                <ShieldCheck className="text-success" size={40} />
                <div>
                  <h1 className="text-3xl font-bold uppercase">Authentic challan</h1>
                  <p className="font-mono text-lg">{data.challan_no}</p>
                </div>
              </div>
              <dl className="mt-6 divide-y text-sm">
                {[
                  ["Vehicle", <span className="font-mono">{data.reg_no_masked}</span>],
                  ["Violation", data.violation],
                  ["Amount", inr(data.amount)],
                  ["Issued", fmtDateTime(data.issued_at)],
                  ["Status", <StatusBadge status={data.status} />],
                  ["Verified at", fmtDateTime(data.verified_at)],
                ].map(([k, v], i) => (
                  <div key={i} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">Only non-sensitive details are shown. Owner information is never displayed publicly.</p>
            </>
          )}
          <Link to="/" className="mt-6 block text-center text-sm text-primary underline">Go to e-Challan</Link>
        </div>
      </div>
    </div>
  );
}
