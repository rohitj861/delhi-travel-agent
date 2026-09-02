import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, TrainFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In or Create Account — Delhi NCR Travel Concierge" },
      {
        name: "description",
        content:
          "Sign in or create a free account to save your Delhi NCR travel concierge preferences and access your account area.",
      },
      { property: "og:title", content: "Sign In or Create Account — Delhi NCR Travel Concierge" },
      {
        property: "og:description",
        content: "Access your Delhi NCR Travel Concierge account with email and password.",
      },
    ],
  }),
  component: AuthPage,
});

function friendly(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (m.includes("email not confirmed"))
    return "Please confirm your email address first — check your inbox.";
  if (m.includes("password should be")) return "Password must be at least 6 characters.";
  if (m.includes("invalid email") || m.includes("unable to validate email"))
    return "Please enter a valid email address.";
  return message;
}

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && session) navigate({ to: "/", replace: true });
  }, [session, sessionLoading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) setError(friendly(error.message));
        else if (!data.session)
          setNotice("Account created. Check your email to confirm before signing in.");
        else navigate({ to: "/", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(friendly(error.message));
        else navigate({ to: "/", replace: true });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-surface text-primary-foreground">
        <div className="mx-auto max-w-4xl px-5 py-10">
          <p className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] opacity-80">
            <TrainFront className="h-4 w-4" /> Delhi NCR Travel Concierge
          </p>
          <h1 className="mt-3 text-3xl font-normal sm:text-4xl">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 py-10">
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm text-muted-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm text-muted-foreground">
              Password
            </label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-primary">{notice}</p>}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Sign up"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="text-primary underline"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setNotice(null);
              }}
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/" className="text-muted-foreground underline">
            Back to the concierge
          </Link>
        </p>
      </main>
    </div>
  );
}
