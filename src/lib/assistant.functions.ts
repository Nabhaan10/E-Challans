import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).min(1).max(30),
});

export const askData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: isAdmin } = await sb.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) return { error: "Only administrators can use the assistant." };

    const [ch, pay, ap, veh] = await Promise.all([
      sb.from("challans").select("status,amount,issued_at,location_text,traffic_violations(name),vehicles(vehicle_type)").limit(5000),
      sb.from("payments").select("amount,method,paid_at").limit(5000),
      sb.from("appeals").select("status,ground").limit(5000),
      sb.from("vehicles").select("vehicle_type").limit(5000),
    ]);
    const count = <T,>(rows: T[], k: (r: T) => string) => {
      const m: Record<string, number> = {};
      rows.forEach((r) => { const key = k(r) || "ΓÇö"; m[key] = (m[key] ?? 0) + 1; });
      return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 15));
    };
    const challans = ch.data ?? [];
    const payments = pay.data ?? [];
    const byMonth: Record<string, { challans: number; revenue: number }> = {};
    challans.forEach((c) => { const k = c.issued_at.slice(0, 7); (byMonth[k] ??= { challans: 0, revenue: 0 }).challans++; });
    payments.forEach((p) => { const k = p.paid_at.slice(0, 7); (byMonth[k] ??= { challans: 0, revenue: 0 }).revenue += Number(p.amount); });
    const summary = {
      today: new Date().toISOString().slice(0, 10),
      totalChallans: challans.length,
      totalFinesINR: challans.reduce((s, c) => s + Number(c.amount), 0),
      totalCollectedINR: payments.reduce((s, p) => s + Number(p.amount), 0),
      challansByStatus: count(challans, (c) => c.status),
      byViolation: count(challans, (c) => (c.traffic_violations as { name: string } | null)?.name ?? ""),
      byLocation: count(challans, (c) => c.location_text.split(",")[0] ?? ""),
      byVehicleType: count(challans, (c) => (c.vehicles as { vehicle_type: string } | null)?.vehicle_type ?? ""),
      paymentsByMethod: count(payments, (p) => p.method),
      appealsByStatus: count(ap.data ?? [], (a) => a.status),
      appealsByGround: count(ap.data ?? [], (a) => a.ground),
      registeredVehicles: veh.data?.length ?? 0,
      monthly: byMonth,
    };

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { error: "AI service is not configured." };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a data analyst for an Indian traffic e-Challan system. Answer only from the JSON statistics below. Use Γé╣ for money, be concise, use short bullet lists or small markdown tables. If the data can't answer, say so.\n\nSTATS:\n" +
              JSON.stringify(summary),
          },
          ...data.messages,
        ],
      }),
    });
    if (res.status === 429) return { error: "Too many requests ΓÇö please wait a moment and try again." };
    if (res.status === 402) return { error: "AI credits are exhausted for this workspace." };
    if (!res.ok) {
      console.error("AI gateway", res.status, await res.text());
      return { error: "The assistant is unavailable right now." };
    }
    const json = await res.json();
    return { reply: String(json.choices?.[0]?.message?.content ?? "") };
  });
