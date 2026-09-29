import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — e-Challan" },
      { name: "description", content: "Choose a new password for your account." },
      { property: "og:title", content: "Set new password — e-Challan" },
      { property: "og:description", content: "Choose a new password." },
    ],
  }),
  component: Page,
});

function Page() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form
        className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pw.length < 8) return toast.error("Password must be at least 8 characters");
          const { error } = await supabase.auth.updateUser({ password: pw });
          if (error) return toast.error(error.message);
          toast.success("Password updated");
          navigate({ to: "/auth" });
        }}
      >
        <h1 className="text-3xl font-bold uppercase">New password</h1>
        <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" required />
        <Button className="w-full" type="submit">Update password</Button>
      </form>
    </div>
  );
}
