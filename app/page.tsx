"use client";

export { default } from "./page-classic";

// Phase 4 — single-page UI for POST /api/ask.
// Stitch redesign: "Premium Fintech Material" (dark, M3 tonal elevation).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AskResponse, Citation } from "@/lib/contracts";
import ParticlesBackground from "@/components/ParticlesBackground";

// ──────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────

const EXAMPLE_QUESTIONS = [
  "What is the expense ratio of HDFC Mid-Cap Opportunities Fund?",
  "How do I download my capital gains statement?",
  "What is the lock-in for HDFC ELSS Tax Saver?",
];

// The five HDFC schemes the corpus covers — surfaced in the UI so a first-
// time visitor knows the exact scope before they type (mirrors out-of-scope
// refusal copy in lib/answer.ts). Kept in sync with corpus/sources.json
// canonical names and lib/facts.ts SCHEME_ALIASES.canonical.
const COVERED_SCHEMES: { name: string; category: string }[] = [
  { name: "HDFC Mid-Cap Opportunities Fund", category: "Mid Cap" },
  { name: "HDFC Flexi Cap Fund", category: "Flexi Cap" },
  { name: "HDFC Focused Fund", category: "Focused" },
  { name: "HDFC ELSS Tax Saver", category: "ELSS" },
  { name: "HDFC Large Cap Fund", category: "Large Cap" },
];

const DISCLAIMER = "Facts-only. No investment advice.";

type Phase = "idle" | "loading" | "loaded" | "error";

// ──────────────────────────────────────────────────────────────────────────
// UI helpers
// ──────────────────────────────────────────────────────────────────────────

function toneFor(type: AskResponse["type"]): {
  label: string;
  chipClass: string;
  surfaceClass: string;
} {
  switch (type) {
    case "answer":
      return {
        label: "Analysis result",
        chipClass: "bg-primary-container/10 text-primary-container",
        surfaceClass: "bg-surface-container-high",
      };
    case "refusal":
      return {
        label: "Advisory refused",
        chipClass: "bg-secondary-container/25 text-on-surface-variant",
        surfaceClass: "bg-surface-container-high",
      };
    case "out_of_scope":
      return {
        label: "Out of scope",
        chipClass: "bg-surface-container-lowest text-on-surface-variant",
        surfaceClass: "bg-surface-container-high",
      };
    case "pii_blocked":
      return {
        label: "Personal info blocked",
        chipClass: "bg-error-container/25 text-on-error-container",
        surfaceClass: "bg-surface-container-high",
      };
  }
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Best-effort fallback for older browsers.
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

function CitationRow({ citation }: { citation: Citation }) {
  return (
    <div className="flex items-center gap-2 text-on-surface-variant">
      <span className="material-symbols-outlined text-sm" style={{ fontSize: 16 }}>
        link
      </span>
      <a
        href={citation.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-label-small hover:underline decoration-primary-container"
      >
        {citation.label}
      </a>
    </div>
  );
}

function LastUpdatedRow({ lastUpdated }: { lastUpdated: string | null }) {
  if (!lastUpdated) return null;
  return (
    <div className="flex items-center gap-2 text-on-surface-variant">
      <span className="material-symbols-outlined text-sm" style={{ fontSize: 16 }}>
        history
      </span>
      <span className="text-label-small">Last updated: {lastUpdated}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface-container-high rounded-m3-xl overflow-hidden border border-outline-variant/30">
      <div className="p-8">
        <div className="mb-6 h-6 w-40 animate-pulse rounded-m3-sm bg-surface-container-highest" />
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded-m3-sm bg-surface-container-highest" />
          <div className="h-4 w-11/12 animate-pulse rounded-m3-sm bg-surface-container-highest" />
          <div className="h-4 w-4/5 animate-pulse rounded-m3-sm bg-surface-container-highest" />
        </div>
      </div>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-surface-container-high rounded-m3-xl overflow-hidden border border-outline-variant/30">
      <div className="p-8">
        <span className="inline-block rounded-full bg-error-container/20 px-3 py-1 text-label-small uppercase tracking-wider font-bold text-on-error-container">
          Network error
        </span>
        <p className="mt-4 text-body-medium text-on-surface-variant">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2 text-label-large text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            refresh
          </span>
          Try again
        </button>
      </div>
    </div>
  );
}

function ResponseCard({ response, onShare }: { response: AskResponse; onShare: () => void }) {
  const { label, chipClass, surfaceClass } = toneFor(response.type);
  const citations = response.citations ?? (response.citation ? [response.citation] : []);

  // Minimal “metric highlight” for numeric answers (e.g., expense ratio).
  const percent = response.answer.match(/\b\d+(\.\d+)?%/g)?.[0] ?? null;

  return (
    <div className={`${surfaceClass} rounded-m3-xl overflow-hidden border border-outline-variant/30 transition-all`}>
      <div className="p-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <span
              className={`inline-block rounded-full px-3 py-1 text-label-small uppercase tracking-wider font-bold ${chipClass}`}
            >
              {label}
            </span>
            <h2 className="mt-3 text-headline-medium text-on-surface">Assistant answer</h2>
          </div>
          <button
            type="button"
            onClick={onShare}
            className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Share / copy"
          >
            share
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
          <div className="bg-surface-container-highest p-6 rounded-m3-lg flex-grow w-full">
            {percent ? (
              <>
                <p className="text-body-medium text-on-surface-variant mb-2">
                  Key numeric value detected:
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-display-small text-primary-container font-bold">{percent}</span>
                  <span className="text-on-surface-variant text-label-large">(see details below)</span>
                </div>
              </>
            ) : null}
            <p className={`whitespace-pre-wrap break-words ${percent ? "mt-4" : ""} text-body-large text-on-surface`}>
              {response.answer}
            </p>
          </div>

          {/* Decorative “verification ring” */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 relative flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  className="text-surface-container-highest"
                  cx="64"
                  cy="64"
                  r="58"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  className="text-primary-container"
                  cx="64"
                  cy="64"
                  r="58"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="364.4"
                  strokeDashoffset="110"
                />
              </svg>
              <span className="absolute text-title-medium text-on-surface">
                {response.citation ? "Cited" : "Ready"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-outline-variant/20 pt-6">
          {citations.length ? (
            <p className="text-body-medium text-on-surface-variant">
              {citations.length === 1
                ? "Source is linked below — verified against official HDFC AMC pages."
                : "Sources are linked below — official HDFC AMC + Groww (expense ratio)."}
            </p>
          ) : null}
        </div>
      </div>

      <div className="bg-surface-container-lowest px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
          {citations.length ? (
            <div className="flex flex-col gap-2">
              {citations.map((c) => (
                <CitationRow key={c.url} citation={c} />
              ))}
            </div>
          ) : null}
          <span className="text-label-small text-on-surface-variant">{DISCLAIMER}</span>
        </div>
        <LastUpdatedRow lastUpdated={response.lastUpdated} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────

function HomeUnused() {
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [recentQuestions, setRecentQuestions] = useState<string[]>([]);
  const lastAsked = useRef<string>("");

  const isLoading = phase === "loading";

  // Persist only the last 3 questions (latest first).
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mf_faq_recent_questions");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setRecentQuestions(parsed.filter((x) => typeof x === "string").slice(0, 3));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mf_faq_recent_questions", JSON.stringify(recentQuestions.slice(0, 3)));
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
      if (!text || isLoading) return; // edges 4.4, 4.8

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
    <main className="min-h-screen bg-surface text-on-surface">
      <ParticlesBackground />

      {/* TopAppBar */}
      <header className="bg-surface fixed top-0 w-full z-50 border-b border-outline-variant/30 backdrop-blur">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 lg:px-8 h-16 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-title-large font-bold text-on-surface">HDFC Mutual Fund</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-primary font-bold text-label-large transition-all hover:bg-surface-container-high px-3 py-2 rounded-m3-sm" href="#">
              Assistant
            </a>
            <a className="text-on-surface-variant text-label-large transition-all hover:bg-surface-container-high px-3 py-2 rounded-m3-sm" href="#">
              Funds
            </a>
            <a className="text-on-surface-variant text-label-large transition-all hover:bg-surface-container-high px-3 py-2 rounded-m3-sm" href="#">
              Contact
            </a>
          </div>
          <div className="flex items-center gap-4">
            {/* Recent questions (max 3) */}
            {recentQuestions.length ? (
              <div className="hidden lg:block">
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-m3-lg px-3 py-2 max-w-[340px]">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      history
                    </span>
                    <span className="text-label-small">Recent</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {recentQuestions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => ask(q)}
                        disabled={isLoading}
                        className="text-left truncate rounded-m3-sm px-2 py-1 text-label-small text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
                        title={q}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: '"FILL" 1, "wght" 500, "GRAD" 0, "opsz" 24' }}
              aria-label="Verified"
              title="Verified sources"
            >
              verified
            </span>
            <button className="md:hidden material-symbols-outlined text-on-surface" aria-label="Menu">
              menu
            </button>
          </div>
        </div>
      </header>

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Hero */}
        <section className="text-center mb-12">
          <h1 className="text-on-surface mb-6 max-w-4xl mx-auto leading-tight font-medium text-4xl sm:text-5xl lg:text-6xl">
            Five HDFC schemes. <br />
            <span className="text-primary">Verified</span> answers.
          </h1>
          <p className="text-body-medium text-on-surface-variant max-w-3xl mx-auto">
            Every reply is verified against official HDFC AMC pages (and Groww for expense ratio).
          </p>

          {/* Covered Schemes (Chips) */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {COVERED_SCHEMES.map((s) => (
              <div
                key={s.category}
                className="bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-primary-container" />
                <span className="text-label-large text-on-surface-variant">{s.category}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Search Bar */}
        <div className="relative max-w-3xl mx-auto mb-10">
          <form
            onSubmit={onSubmit}
            className={[
              "bg-surface-container rounded-m3-xl p-2 flex items-center shadow-m3-3 transition-transform",
              "focus-within:ring-2 focus-within:ring-primary-container",
              isFocused ? "scale-[1.01]" : "",
            ].join(" ")}
          >
            <span className="material-symbols-outlined ml-4 text-on-surface-variant" aria-hidden>
              search
            </span>
            <input
              aria-label="Mutual Fund Assistant Query"
              className="bg-transparent border-none focus:ring-0 flex-grow px-4 text-on-surface text-body-large placeholder:text-on-surface-variant outline-none"
              placeholder="Ask factual questions about expense ratio, exit load, minimum SIP, lock-in, riskometer, benchmark, or statements…"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isLoading}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoComplete="off"
              spellCheck
            />
            <button
              type="submit"
              disabled={buttonDisabled}
              className="bg-primary-container text-on-primary-container px-8 py-3 rounded-full text-label-large font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ask
            </button>
          </form>

          {copied ? (
            <p className="mt-2 text-label-small text-on-surface-variant">Copied to clipboard.</p>
          ) : null}
        </div>

        {/* Suggestions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {EXAMPLE_QUESTIONS.map((q, idx) => {
            const meta =
              idx === 0
                ? { icon: "trending_up", label: "Popular inquiry" }
                : idx === 1
                  ? { icon: "person", label: "Fund info" }
                  : { icon: "query_stats", label: "Rules & constraints" };
            return (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                disabled={isLoading}
                className="bg-surface-container hover:bg-surface-container-high transition-colors p-6 rounded-m3-xl text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col h-full justify-between">
                  <span className="text-title-medium text-on-surface group-hover:text-primary transition-colors">
                    “{q}”
                  </span>
                  <div className="flex items-center gap-2 mt-4 text-on-surface-variant">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {meta.icon}
                    </span>
                    <span className="text-label-small">{meta.label}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Answer Card */}
        <div className="max-w-5xl mx-auto">
          {phase === "loading" ? (
            <SkeletonCard />
          ) : phase === "error" ? (
            <ErrorCard message={error ?? "Something went wrong."} onRetry={onRetry} />
          ) : response ? (
            <ResponseCard
              response={response}
              onShare={async () => {
                const citations = response.citations ?? (response.citation ? [response.citation] : []);
                const payload = [
                  response.answer,
                  citations.length
                    ? citations.map((c) => `Source: ${c.label} — ${c.url}`).join("\n")
                    : null,
                  response.lastUpdated ? `Last updated: ${response.lastUpdated}` : null,
                ]
                  .filter(Boolean)
                  .join("\n");
                await copyText(payload);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              }}
            />
          ) : (
            <div className="bg-surface-container-high rounded-m3-xl overflow-hidden border border-outline-variant/30">
              <div className="p-8 text-on-surface-variant">
                Ask a question to see a cited answer here.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-surface-container-lowest">
        <div className="flex flex-col items-center w-full py-12 px-4 sm:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
          <div className="text-title-medium font-bold text-on-surface-variant">HDFC Mutual Fund</div>
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <a className="text-on-surface-variant text-label-small hover:text-primary transition-colors" href="#">
              Terms of Use
            </a>
            <a className="text-on-surface-variant text-label-small hover:text-primary transition-colors" href="#">
              Privacy Policy
            </a>
            <a className="text-on-surface-variant text-label-small hover:text-primary transition-colors" href="#">
              Disclaimers
            </a>
            <a className="text-on-surface-variant text-label-small hover:text-primary transition-colors" href="#">
              Sitemap
            </a>
          </nav>
          <div className="text-on-surface-variant text-body-medium text-center max-w-2xl opacity-70">
            © {new Date().getFullYear()} HDFC Mutual Fund. All rights reserved. Investment in mutual funds are
            subject to market risks. Read all scheme related documents carefully before investing.
          </div>
        </div>
      </footer>
    </main>
  );
}
