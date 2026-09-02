import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History, Loader2, Trash2, TrainFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteTravelQuery, listTravelQueries } from "@/lib/travel-history.functions";
import { splitReply } from "@/lib/render-agent-html";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "My Travel Questions — Delhi NCR Travel Concierge" },
      {
        name: "description",
        content: "Revisit your saved Delhi NCR travel questions and the concierge answers.",
      },
      { property: "og:title", content: "My Travel Questions — Delhi NCR Travel Concierge" },
      {
        property: "og:description",
        content: "Your private history of Delhi NCR concierge questions and answers.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const list = useServerFn(listTravelQueries);
  const remove = useServerFn(deleteTravelQuery);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["travel-queries"],
    queryFn: () => list(),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["travel-queries"] }),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-surface text-primary-foreground">
        <div className="mx-auto max-w-4xl px-5 py-10">
          <p className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] opacity-80">
            <TrainFront className="h-4 w-4" /> Delhi NCR Travel Concierge
          </p>
          <h1 className="mt-3 text-3xl font-normal sm:text-4xl">My travel questions</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-6 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link to="/">Back to concierge</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/account">Account</Link>
          </Button>
        </div>

        {isLoading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your history…
          </p>
        )}
        {error && <p className="text-sm text-destructive">Could not load your history.</p>}
        {data && data.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <History className="h-4 w-4" /> No saved questions yet — ask the concierge something.
          </p>
        )}

        <div className="space-y-6">
          {data?.map((row) => {
            const { summary, html } = splitReply(row.answer);
            return (
              <article key={row.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base">{row.question}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Delete this saved question"
                    onClick={() => del.mutate(row.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {summary && (
                  <p className="mt-3 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-foreground">
                    {summary}
                  </p>
                )}
                {html && (
                  <div className="agent-cards mt-3" dangerouslySetInnerHTML={{ __html: html }} />
                )}
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
