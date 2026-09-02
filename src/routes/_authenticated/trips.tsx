import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Map, Trash2, TrainFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteSavedTrip, listSavedTrips } from "@/lib/saved-trips.functions";
import { splitReply } from "@/lib/render-agent-html";

export const Route = createFileRoute("/_authenticated/trips")({
  head: () => ({
    meta: [
      { title: "My Trips — Delhi NCR Travel Concierge" },
      {
        name: "description",
        content: "View and manage the Delhi NCR itineraries you saved with the travel concierge.",
      },
      { property: "og:title", content: "My Trips — Delhi NCR Travel Concierge" },
      {
        property: "og:description",
        content: "Your private collection of saved Delhi NCR itineraries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TripsPage,
});

function TripsPage() {
  const list = useServerFn(listSavedTrips);
  const remove = useServerFn(deleteSavedTrip);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["saved-trips"],
    queryFn: () => list(),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-trips"] }),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-surface text-primary-foreground">
        <div className="mx-auto max-w-4xl px-5 py-10">
          <p className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] opacity-80">
            <TrainFront className="h-4 w-4" /> Delhi NCR Travel Concierge
          </p>
          <h1 className="mt-3 text-3xl font-normal sm:text-4xl">My trips</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-6 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link to="/">Back to concierge</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/history">My questions</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/account">Account</Link>
          </Button>
        </div>

        {isLoading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your saved trips…
          </p>
        )}
        {error && <p className="text-sm text-destructive">Could not load your saved trips.</p>}
        {data && data.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Map className="h-4 w-4" /> No saved trips yet — save an itinerary from the concierge.
          </p>
        )}

        <div className="space-y-6">
          {data?.map((trip) => {
            const { summary, html } = splitReply(trip.itinerary);
            return (
              <article
                key={trip.id}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base">{trip.trip_name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {trip.destination ? `${trip.destination} · ` : ""}
                      Saved {new Date(trip.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${trip.trip_name}`}
                    onClick={() => del.mutate(trip.id)}
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
