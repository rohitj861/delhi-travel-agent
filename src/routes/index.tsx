import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Compass, Loader2, Send, TrainFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askDelhiAgent } from "@/lib/delhi-agent.functions";
import { splitReply } from "@/lib/render-agent-html";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Delhi NCR Travel Concierge — Metro-Smart Trip Guide" },
      {
        name: "description",
        content:
          "An AI travel concierge for Delhi NCR: heritage, street food, markets and stays, each with the nearest Metro station and line.",
      },
      { property: "og:title", content: "Delhi NCR Travel Concierge — Metro-Smart Trip Guide" },
      {
        property: "og:description",
        content:
          "Ask for monuments, food, markets or stays across Delhi NCR and get transit-grounded recommendations.",
      },
    ],
  }),
  component: Index,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "One day in Old Delhi: heritage + street food",
  "Best Mughlai dinner near Khan Market",
  "Markets for handicrafts and handlooms",
  "Where to stay in South Delhi under ₹6,000",
];

function Index() {
  const ask = useServerFn(askDelhiAgent);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const res = await ask({ data: { messages: next } });
      if ("error" in res && res.error) setError(res.error);
      else setMessages([...next, { role: "assistant", content: res.content ?? "" }]);
    } catch {
      setError("Something went wrong reaching the concierge.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-surface text-primary-foreground">
        <div className="mx-auto max-w-4xl px-5 py-12">
          <p className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] opacity-80">
            <TrainFront className="h-4 w-4" /> Metro-first guidance
          </p>
          <h1 className="mt-3 text-4xl font-normal sm:text-5xl">Delhi NCR Travel Concierge</h1>
          <p className="mt-3 max-w-2xl text-base opacity-90">
            Heritage, street food, markets, stays and transit across Old &amp; New Delhi, Gurugram
            and Noida — every recommendation with its nearest Metro station and line.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">
        {messages.length === 0 && (
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg">
              <Compass className="h-5 w-5 text-primary" /> Start with a question
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <Button key={s} variant="secondary" size="sm" onClick={() => send(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </section>
        )}

        <div className="space-y-6">
          {messages.map((m, i) => {
            if (m.role === "user") {
              return (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] rounded-xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {m.content}
                  </p>
                </div>
              );
            }
            const { summary, html } = splitReply(m.content);
            return (
              <article key={i} className="space-y-3">
                {summary && (
                  <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-foreground">
                    {summary}
                  </p>
                )}
                {html && (
                  <div className="agent-cards" dangerouslySetInnerHTML={{ __html: html }} />
                )}
              </article>
            );
          })}

          {loading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Planning your Delhi route…
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div ref={endRef} />
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <form
          className="mx-auto flex max-w-4xl gap-2 px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about monuments, food, markets, stays or metro routes…"
            aria-label="Ask the Delhi NCR concierge"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
