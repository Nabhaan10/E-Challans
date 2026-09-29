import { supabase } from "@/integrations/supabase/client";

export const CHALLAN_SELECT =
  "id,challan_no,issued_at,amount,status,location_text,lat,lng,due_date,vehicle_id,owner_id,officer_id,vehicles(reg_no,vehicle_type),traffic_violations(name,code,category)";

export type ChallanRow = {
  id: string;
  challan_no: string;
  issued_at: string;
  amount: number;
  status: string;
  location_text: string;
  lat: number | null;
  lng: number | null;
  due_date: string;
  vehicle_id: string;
  owner_id: string;
  officer_id: string | null;
  vehicles: { reg_no: string; vehicle_type: string } | null;
  traffic_violations: { name: string; code: string; category: string } | null;
};

export async function fetchChallans(limit = 1000): Promise<ChallanRow[]> {
  const { data, error } = await supabase
    .from("challans")
    .select(CHALLAN_SELECT)
    .order("issued_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as ChallanRow[];
}

export async function fetchPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select("id,transaction_id,amount,method,status,paid_at,challan_id,challans(challan_no)")
    .order("paid_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function groupCount<T>(rows: T[], key: (r: T) => string) {
  const m = new Map<string, number>();
  rows.forEach((r) => m.set(key(r), (m.get(key(r)) ?? 0) + 1));
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function dailySeries<T>(rows: T[], dateOf: (r: T) => string, valueOf: (r: T) => number, days = 30) {
  const out: { day: string; value: number }[] = [];
  const idx = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const k = d.toISOString().slice(0, 10);
    idx.set(k, out.length);
    out.push({ day: k.slice(5), value: 0 });
  }
  rows.forEach((r) => {
    const k = dateOf(r).slice(0, 10);
    const i = idx.get(k);
    const o = i !== undefined ? out[i] : undefined; if (o) o.value += valueOf(r);
  });
  return out;
}
