import { supabase } from "@/integrations/supabase/client";
import { getRouteApi } from "@tanstack/react-router";

export type Role = "admin" | "officer" | "citizen";

export async function loadSession() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const [{ data: roles }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", data.user.id),
    supabase.from("profiles").select("full_name,email").eq("id", data.user.id).maybeSingle(),
  ]);
  const list = (roles ?? []).map((r) => r.role as Role);
  const role: Role = list.includes("admin") ? "admin" : list.includes("officer") ? "officer" : "citizen";
  return { user: data.user, role, profile: profile ?? { full_name: data.user.email ?? "", email: data.user.email } };
}

export const homeFor = (role: Role) =>
  role === "admin" ? "/admin" : role === "officer" ? "/officer" : "/citizen";

const authApi = getRouteApi("/_authenticated");
export const useAuth = () => authApi.useRouteContext();
