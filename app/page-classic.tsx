"use client";

// Classic UI/UX (as per screenshot) + requested tweaks:
// - Align example cards + move label+icon INSIDE each card
// - Add a small logo in the top-right disclaimer chip
// - Show recent questions BELOW the answer (max 3, latest-first, FIFO eviction)
// - Improve footer separator + alignment + text sizing

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AskResponse, Citation } from "@/lib/contracts";

function HdfcLogo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 68 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="HDFC Logo">
      <path d="M0 2C0 0.895431 0.895431 0 2 0H48V20H2C0.89543 20 0 19.1046 0 18V2Z" fill="#1C3F94" />
      <text x="6" y="14" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.5">HDFC</text>
      <path d="M48 0H66C67.1046 0 68 0.895431 68 2V18C68 19.1046 67.1046 20 66 20H48V0Z" fill="#E31837" />
      <polygon points="58,5 63,10 58,15 53,10" stroke="#FFFFFF" strokeWidth="1.8" fill="none" />
    </svg>
  );
}


const EXAMPLE_QUESTIONS = [
  "What is the expense ratio of HDFC Mid-Cap Opportunities Fund?",
  "How do I download my capital gains statement?",
  "What is the lock-in for HDFC ELSS Tax Saver?",
];

const EXAMPLE_LABELS = ["Popular inquiry", "Fund info", "Rules & constraints"] as const;

const COVERED_SCHEMES: { name: string; category: string }[] = [
  { name: "HDFC Mid-Cap Opportunities Fund", category: "Mid Cap" },
  { name: "HDFC Flexi Cap Fund", category: "Flexi Cap" },
  { name: "HDFC Focused Fund", category: "Focused" },
  { name: "HDFC ELSS Tax Saver", category: "ELSS" },
  { name: "HDFC Large Cap Fund", category: "Large Cap" },
];

const DISCLAIMER = "Facts-only. No investment advice.";
const RECENT_KEY = "mf_faq_recent_questions";

type Phase = "idle" | "loading" | "loaded" | "error";

function SendIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}

function ExternalLinkIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

function ShieldIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function TrendingIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M14 8h6v6" />
    </svg>
  );
}

function InfoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function RulesIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M7 12h14" />
      <path d="M7 18h14" />
      <path d="M3 12h2" />
      <path d="M3 18h2" />
    </svg>
  );
}

function ExampleCard({
  question,
  label,
  icon,
  disabled,
  onPick,
}: {
  question: string;
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
  onPick: (q: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(question)}
      disabled={disabled}
      className="group flex h-full w-full flex-col justify-between gap-3.5 rounded-m3-xl border border-outline-variant bg-surface-low p-4 text-left transition hover:border-primary hover:bg-primary-container/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="flex w-full items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
          <span className="flex h-3 w-3 items-center justify-center">
            {icon}
          </span>
          <span>{label}</span>
        </span>
        <span className="shrink-0 text-on-surface-variant transition group-hover:text-primary group-hover:translate-x-0.5" aria-hidden>
          →
        </span>
      </div>

      <div className="flex-grow">
        <span className="text-body-medium font-medium text-on-surface break-words leading-normal">
          “{question}”
        </span>
      </div>
    </button>
  );
}



function StatusChip({
  tone,
  label,
}: {
  tone: "answer" | "advisory" | "out_of_scope" | "pii";
  label: string;
}) {
  const tones: Record<typeof tone, string> = {
    answer: "bg-primary-container text-on-primary-container",
    advisory: "bg-secondary-container text-on-secondary-container",
    out_of_scope: "bg-surface-high text-on-surface-variant",
    pii: "bg-error-container text-on-error-container",
  };
  return (
    <span
      className={`text-label-small inline-flex items-center gap-1.5 rounded-m3-xs px-2 py-1 uppercase tracking-wide ${tones[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

function tonalSurfaceFor(type: AskResponse["type"]): {
  surface: string;
  chip: Parameters<typeof StatusChip>[0]["tone"];
  chipLabel: string;
} {
  switch (type) {
    case "answer":
      return { surface: "bg-surface-low", chip: "answer", chipLabel: "Answer" };
    case "refusal":
      return { surface: "bg-secondary-container/40", chip: "advisory", chipLabel: "Advisory refused" };
    case "out_of_scope":
      return { surface: "bg-surface-container", chip: "out_of_scope", chipLabel: "Out of scope" };
    case "pii_blocked":
      return { surface: "bg-error-container/60", chip: "pii", chipLabel: "Personal info" };
  }
}

function CitationBlock({ citations, lastUpdated }: { citations: Citation[]; lastUpdated: string | null }) {
  return (
    <div className="mt-5 flex flex-col gap-2 border-t border-outline-variant pt-4">
      {citations.map((citation) => (
        <a
          key={citation.url}
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-label-large inline-flex items-start gap-2 text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <ExternalLinkIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex flex-col gap-0.5">
            <span>{citation.label}</span>
            <span className="text-label-small break-all font-normal text-on-surface-variant">
              {citation.url}
            </span>
          </span>
        </a>
      ))}
      {lastUpdated ? (
        <p className="text-label-small text-on-surface-variant">Last refreshed: {lastUpdated}</p>
      ) : null}
    </div>
  );
}

function ResponseCard({ response }: { response: AskResponse }) {
  const { surface, chip, chipLabel } = tonalSurfaceFor(response.type);
  const citations = response.citations ?? (response.citation ? [response.citation] : []);

  return (
    <article
      className={`rounded-m3-lg ${surface} animate-fade-in p-5 shadow-m3-1 sm:rounded-m3-xl sm:p-6`}
      aria-live="polite"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <StatusChip tone={chip} label={chipLabel} />
      </div>
      <p className="text-body-large whitespace-pre-wrap break-words text-on-surface">{response.answer}</p>
      {citations.length ? <CitationBlock citations={citations} lastUpdated={response.lastUpdated} /> : null}
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-m3-lg bg-surface-low p-5 shadow-m3-1 sm:rounded-m3-xl sm:p-6">
      <div className="mb-3 h-4 w-24 animate-pulse rounded-m3-xs bg-surface-high" />
      <div className="space-y-2">
        <div className="h-4 w-full animate-pulse rounded-m3-xs bg-surface-high" />
        <div className="h-4 w-11/12 animate-pulse rounded-m3-xs bg-surface-high" />
        <div className="h-4 w-3/4 animate-pulse rounded-m3-xs bg-surface-high" />
      </div>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <article className="rounded-m3-lg bg-error-container/60 p-5 shadow-m3-1 sm:rounded-m3-xl sm:p-6" role="alert">
      <StatusChip tone="pii" label="Couldn't reach the assistant" />
      <p className="text-body-medium mt-3 text-on-error-container">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-label-large mt-4 inline-flex items-center gap-2 rounded-m3-xl border border-error/60 px-4 py-2 text-on-error-container transition hover:bg-error/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
      >
        Try again
      </button>
    </article>
  );
}

export default function ClassicHome() {
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentQuestions, setRecentQuestions] = useState<string[]>([]);
  const lastAsked = useRef<string>("");

  const isLoading = phase === "loading";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecentQuestions(parsed.filter((x) => typeof x === "string").slice(0, 3));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recentQuestions.slice(0, 3)));
    } catch {
      // ignore
    }
  }, [recentQuestions]);

  const pushRecent = useCallback((text: string) => {
    setRecentQuestions((prev) => [text, ...prev.filter((q) => q !== text)].slice(0, 3));
  }, []);

  const ask = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || isLoading) return;

      setQuestion(text);
      lastAsked.current = text;
      pushRecent(text);
      setPhase("loading");
      setResponse(null);
      setError(null);
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ question: text }),
        });
        if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
        const data = (await res.json()) as AskResponse;
        setResponse(data);
        setPhase("loaded");
      } catch (err) {
        setError((err as Error).message || "Network error");
        setPhase("error");
      }
    },
    [isLoading, pushRecent],
  );

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    ask(question);
  };

  const onRetry = () => ask(lastAsked.current || question);

  const buttonDisabled = useMemo(() => isLoading || question.trim().length === 0, [isLoading, question]);

  return (
    <main className="relative min-h-screen pb-16">
      <header className="sticky top-0 z-10 border-b border-outline-variant bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <HdfcLogo className="h-5.5 w-auto" />
            <span className="text-title-medium font-semibold text-on-surface">
              <span className="hidden sm:inline">Mutual Fund FAQ Assistant</span>
              <span className="sm:hidden">MF FAQ Assistant</span>
            </span>
          </div>
          <span className="text-label-small inline-flex items-center gap-1.5 rounded-m3-xl border border-outline-variant bg-surface-low px-3 py-1.5 text-on-surface-variant">
            <HdfcLogo className="h-3 w-auto opacity-80" />
            <ShieldIcon className="h-3.5 w-3.5 text-primary" />
            {DISCLAIMER}
          </span>
        </div>
      </header>

      <section className="hero-glow">
        <div className="mx-auto max-w-3xl px-4 pb-4 pt-10 sm:px-6 sm:pb-6 sm:pt-14">
          <h1 className="text-display-small text-on-background">
            Five HDFC schemes.
            <br />
            <span className="text-primary">One source</span> per answer.
          </h1>
          <p className="text-body-large mt-4 max-w-xl text-on-surface-variant">
            Ask factual questions about expense ratio, exit load, minimum SIP, lock-in, riskometer, benchmark, or
            how to download a statement. Every reply is verified against an official HDFC AMC, AMFI, or SEBI page.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-2 sm:px-6">
        <p className="text-label-large mb-2 text-on-surface-variant">
          Covered schemes <span className="text-on-surface-variant/70">(Direct plan)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {COVERED_SCHEMES.map((s) => (
            <span
              key={s.name}
              className="text-label-small inline-flex items-center gap-2 rounded-m3-xl border border-outline-variant bg-surface-low px-3 py-1.5 text-on-surface-variant"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--md-brand)" }} aria-hidden />
              <span className="text-on-surface">{s.name}</span>
              <span className="text-on-surface-variant/80">· {s.category}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-2 pt-4 sm:px-6">
        <p className="text-label-large mb-2 text-on-surface-variant">Try one of these</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ExampleCard
            question={EXAMPLE_QUESTIONS[0]}
            label={EXAMPLE_LABELS[0]}
            icon={<TrendingIcon className="h-3.5 w-3.5" />}
            disabled={isLoading}
            onPick={ask}
          />
          <ExampleCard
            question={EXAMPLE_QUESTIONS[1]}
            label={EXAMPLE_LABELS[1]}
            icon={<InfoIcon className="h-3.5 w-3.5" />}
            disabled={isLoading}
            onPick={ask}
          />
          <ExampleCard
            question={EXAMPLE_QUESTIONS[2]}
            label={EXAMPLE_LABELS[2]}
            icon={<RulesIcon className="h-3.5 w-3.5" />}
            disabled={isLoading}
            onPick={ask}
          />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-4 pt-6 sm:px-6">
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 rounded-m3-xl border border-outline bg-surface-lowest p-1.5 shadow-m3-1 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a factual question…"
            aria-label="Question"
            className="text-body-large min-w-0 flex-1 bg-transparent px-3 py-2 text-on-surface outline-none placeholder:text-on-surface-variant"
            disabled={isLoading}
            autoComplete="off"
            spellCheck
          />
          <button
            type="submit"
            disabled={buttonDisabled}
            className="text-label-large inline-flex items-center gap-2 rounded-m3-xl bg-primary px-4 py-2.5 text-on-primary shadow-m3-1 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-surface-high disabled:text-on-surface-variant disabled:shadow-none"
            aria-label="Ask"
          >
            <span className="hidden sm:inline">Ask</span>
            <SendIcon className="h-4 w-4" />
          </button>
        </form>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6">
        {phase === "loading" ? (
          <SkeletonCard />
        ) : phase === "error" ? (
          <ErrorCard message={error ?? "Something went wrong."} onRetry={onRetry} />
        ) : response ? (
          <ResponseCard response={response} />
        ) : (
          <p className="text-body-medium px-1 py-2 text-on-surface-variant">
            Answers appear here with the official source they came from.
          </p>
        )}
      </section>

      {/* Recent questions should appear below the answer block. */}
      {recentQuestions.length ? (
        <section className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
          <div className="border-t border-outline-variant/30 pt-6">
            <p className="text-label-large mb-3 font-semibold text-on-surface-variant">Recent questions</p>
            <div className="rounded-m3-xl border border-outline-variant bg-surface-low divide-y divide-outline-variant/20 overflow-hidden shadow-m3-1">
              {recentQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  disabled={isLoading}
                  className="group flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-body-medium text-on-surface hover:bg-primary-container/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="break-words pr-2 font-normal leading-normal">{q}</span>
                  <span className="shrink-0 text-on-surface-variant transition group-hover:text-primary group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <footer className="mt-20 border-t border-outline-variant/30 bg-surface-lowest/50 py-8">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-label-medium font-semibold text-on-surface">
            © {new Date().getFullYear()} HDFC Asset Management Company Limited
          </p>
          <p className="text-[11px] leading-relaxed text-on-surface-variant/70 mt-2 max-w-2xl mx-auto">
            Mutual Fund investments are subject to market risks, read all scheme related documents carefully.
          </p>
        </div>
      </footer>
    </main>
  );
}
