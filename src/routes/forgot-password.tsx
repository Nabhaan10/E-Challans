import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — e-Challan" },
      { name: "description", content: "Reset your e-Challan account password." },
      { property: "og:title", content: "Forgot password — e-Challan" },
      { property: "og:description", content: "Request a password reset link." },
    ],
  }),
  component: Page,
});

function Page() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6">
        <h1 className="text-3xl font-bold uppercase">Reset password</h1>
        {sent ? (
          <p className="text-sm text-muted-foreground">If an account exists for {email}, a reset link has been sent.</p>
        ) : (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
              });
              if (error) toast.error(error.message);
              else setSent(true);
            }}
          >
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Button className="w-full" type="submit">Send reset link</Button>
          </form>
        )}
        <Link to="/auth" className="block text-sm text-primary underline">Back to sign in</Link>
      </div>
    </div>
  );
}
