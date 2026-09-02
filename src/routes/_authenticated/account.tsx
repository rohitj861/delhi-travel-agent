import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, TrainFront, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Your Account — Delhi NCR Travel Concierge" },
      {
        name: "description",
        content: "View your Delhi NCR Travel Concierge account details and sign out.",
      },
      { property: "og:title", content: "Your Account — Delhi NCR Travel Concierge" },
      {
        property: "og:description",
        content: "Manage your Delhi NCR Travel Concierge account.",
      },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-surface text-primary-foreground">
        <div className="mx-auto max-w-4xl px-5 py-10">
          <p className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] opacity-80">
            <TrainFront className="h-4 w-4" /> Delhi NCR Travel Concierge
          </p>
          <h1 className="mt-3 text-3xl font-normal sm:text-4xl">Your account</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-10">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg">
            <UserRound className="h-5 w-5 text-primary" /> Profile
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="text-foreground">{user?.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Member since</dt>
              <dd className="text-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link to="/">Back to concierge</Link>
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
