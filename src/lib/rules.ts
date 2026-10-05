import { supabase } from "@/integrations/supabase/client";

export const rulesQuery = {
  queryKey: ["rules-full"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("traffic_violations")
      .select("id,code,name,category,description,why_exists,traffic_rules(id,legal_act,section,applicability,state,vehicle_types,source,is_sample,active,violation_penalties(id,base_fine,additional_penalty,additional_penalty_note))")
      .order("category");
    if (error) throw error;
    return data ?? [];
  },
};

