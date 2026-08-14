import { motion } from "framer-motion";
import { ArrowRight, Link2, ListChecks, Sparkles } from "lucide-react";
import { Link } from "react-router";

const STATUSES = [
  "No response",
  "Replied",
  "In talks",
  "Deal closed",
  "Rejected",
] as const;

const FEATURES = [
  {
    icon: ListChecks,
    title: "Every touchpoint",
    body: "Project, contact, date, status, reason, location and notes — one line per conversation, newest first.",
  },
  {
    icon: Link2,
    title: "Click-to-open links",
    body: "Type t.me/username, skip the protocol. InTrack adds https:// for you and opens the thread in one click.",
  },
  {
    icon: Sparkles,
    title: "Reasons that remember",
    body: "Pick OTC, Market Making, Marketing, Exchange Listing or Growth Partnership — or type your own and keep it for next time.",
  },
] as const;

export default function Landing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen flex-col bg-background text-foreground"
    >
      {/* Nav */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-8">
        <span className="text-lg font-semibold tracking-tight">InTrack</span>
        <Link
          to="/auth?returnTo=/dashboard"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pt-16 pb-24">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
            Web3 business development
          </p>
          <h1 className="mt-6 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Every outreach,
            <br />
            accounted for.
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            InTrack is a quiet, precise log for your BD conversations. Record
            who you contacted, why, and where — then watch deals move.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/auth?returnTo=/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85"
            >
              Open the tracker
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/auth?returnTo=/dashboard"
              className="inline-flex h-10 items-center rounded-md px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Create an account
            </Link>
          </div>
        </div>

        {/* Pipeline strip */}
        <div className="mt-24 border-t border-border/60 pt-6">
          <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground/60 uppercase">
            Pipeline
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-3">
            {STATUSES.map((status, i) => (
              <div key={status} className="flex items-center gap-2">
                <span
                  className={`size-1.5 rounded-full ${
                    status === "Deal closed"
                      ? "bg-foreground"
                      : "bg-muted-foreground/40"
                  }`}
                />
                <span
                  className={`text-xs tracking-wide ${
                    status === "Deal closed"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {status}
                </span>
                {i < STATUSES.length - 1 && (
                  <span className="mx-2 text-muted-foreground/25">—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 divide-y divide-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="px-6 py-12 sm:px-8">
              <feature.icon className="size-5 text-muted-foreground" />
              <h2 className="mt-6 text-sm font-medium tracking-tight">
                {feature.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-24 text-center">
          <h2 className="max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">
            Start with one entry.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Ten seconds to log, one click to the conversation. Your pipeline
            will thank you.
          </p>
          <Link
            to="/auth?returnTo=/dashboard"
            className="mt-8 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85"
          >
            Open the tracker
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium tracking-tight">InTrack</span>
          <span className="text-xs text-muted-foreground/70">
            Web3 BD outreach tracker
          </span>
        </div>
      </footer>
    </motion.div>
  );
}
