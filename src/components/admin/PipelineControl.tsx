"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Radio, Cpu, FileText, Lightbulb, Play,
  CheckCircle2, XCircle, Loader2, Zap, Database,
} from "lucide-react";
import { parseUTC } from "@/lib/dates";

interface Stats {
  totalTweets: number;
  unprocessedTweets: number;
  totalEvents: number;
  totalIdeas: number;
  lastSummaryAt: string | null;
}

type StepStatus = "idle" | "running" | "done" | "error";
interface StepResult { status: StepStatus; message: string; }

const STEPS = [
  { id: "collect",   num: "01", tone: "collect", label: "Collect tweets",   desc: "Scrape Nitter RSS feeds for all active accounts.",                        icon: Radio,    endpoint: "/api/pipeline/collect",   stat: (s: Stats) => `~${s.totalTweets} tweets` },
  { id: "process",   num: "02", tone: "process", label: "Process events",   desc: "Run classifier on unprocessed tweets: score, dedupe, cluster.",          icon: Cpu,      endpoint: "/api/pipeline/process",   stat: (s: Stats) => `${s.unprocessedTweets} unprocessed` },
  { id: "summarize", num: "03", tone: "summary", label: "Generate summary", desc: "Synthesize 4h ecosystem briefing for the report feed.",                   icon: FileText, endpoint: "/api/pipeline/summarize", stat: () => "~8s · Gemini Flash" },
  { id: "ideas",     num: "04", tone: "ideate",  label: "Generate ideas",   desc: "Create content opportunities from top-scored events.",                    icon: Lightbulb,endpoint: "/api/pipeline/ideas",     stat: (s: Stats) => `${s.totalIdeas} ideas total` },
];

const TONE_COLORS: Record<string, string> = {
  collect: "#3b82f6",
  process: "#8b5cf6",
  summary: "#06b6d4",
  ideate:  "#f59e0b",
};

const TONE_BG: Record<string, string> = {
  collect: "rgba(59,130,246,0.15)",
  process: "rgba(139,92,246,0.15)",
  summary: "rgba(6,182,212,0.15)",
  ideate:  "rgba(245,158,11,0.15)",
};

const TONE_BORDER: Record<string, string> = {
  collect: "rgba(59,130,246,0.35)",
  process: "rgba(139,92,246,0.35)",
  summary: "rgba(6,182,212,0.35)",
  ideate:  "rgba(245,158,11,0.35)",
};

function timeAgo(iso: string) {
  const diff = Date.now() - parseUTC(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function formatResult(id: string, data: Record<string, unknown>): string {
  if (id === "collect")   return `Collected ${data.collected ?? 0} tweets from ${data.accounts ?? 0} accounts (${data.skipped ?? 0} filtered)`;
  if (id === "process")   return `${data.processed ?? 0} processed → ${data.events_created ?? 0} events, ${data.clustered ?? 0} clustered, ${data.groq_failed ?? 0} AI failures`;
  if (id === "summarize") return `Summary generated from ${data.event_count ?? 0} events`;
  if (id === "ideas")     return `${data.ideas_created ?? 0} content ideas created`;
  return JSON.stringify(data);
}

export function PipelineControl({ stats: initialStats }: { stats: Stats }) {
  const [stats, setStats] = useState<Stats>(initialStats);
  const [results, setResults] = useState<Record<string, StepResult>>({});
  const [fullRunning, setFullRunning] = useState(false);
  const [progress, setProgress] = useState(-1);

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("/api/pipeline/stats");
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    const id = setInterval(refreshStats, 30_000);
    return () => clearInterval(id);
  }, [refreshStats]);

  async function runStep(endpoint: string, id: string) {
    setResults((r) => ({ ...r, [id]: { status: "running", message: "Running..." } }));
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setResults((r) => ({ ...r, [id]: { status: "done", message: data.message ?? formatResult(id, data) } }));
      await refreshStats();
    } catch (err) {
      setResults((r) => ({ ...r, [id]: { status: "error", message: err instanceof Error ? err.message : "Error" } }));
    }
  }

  async function runAll() {
    setFullRunning(true);
    setProgress(0);
    for (let i = 0; i < STEPS.length; i++) {
      setProgress(i);
      await runStep(STEPS[i].endpoint, STEPS[i].id);
      if (i < STEPS.length - 1) await new Promise((r) => setTimeout(r, 1000));
    }
    setProgress(-1);
    setFullRunning(false);
  }

  const isAnyRunning = fullRunning || Object.values(results).some((r) => r.status === "running");

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="cos-kpi-grid">
        {([
          { label: "TOTAL TWEETS",    value: stats.totalTweets,        icon: Database,  color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", sub: "all-time" },
          { label: "UNPROCESSED",     value: stats.unprocessedTweets,  icon: Cpu,       color: "#f59e0b", bg: "rgba(245,158,11,0.12)", sub: "awaiting classifier" },
          { label: "EVENTS SCORED",   value: stats.totalEvents,        icon: Zap,       color: "#06b6d4", bg: "rgba(6,182,212,0.12)",  sub: "last 24h" },
          { label: "IDEAS GENERATED", value: stats.totalIdeas,         icon: Lightbulb, color: "#4ade80", bg: "rgba(74,222,128,0.08)", sub: "last 7 days" },
        ] as const).map((s) => (
          <div
            key={s.label}
            style={{
              background: `linear-gradient(135deg, ${s.bg} 0%, var(--surface) 65%)`,
              border: "1px solid var(--hairline)",
              borderRadius: 10,
              padding: "18px 20px 16px",
            }}
          >
            <div style={{
              fontFamily: "var(--font-geist-mono)", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase" as const,
              color: "var(--fg-4)", display: "flex", alignItems: "center", gap: 6, marginBottom: 14,
            }}>
              <s.icon style={{ width: 13, height: 13 }} />
              {s.label}
            </div>
            <div style={{ fontSize: 46, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 10 }}>
              {s.value}
            </div>
            <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--fg-4)" }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {stats.lastSummaryAt && (
        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10.5, color: "var(--fg-4)" }}>
          Last summary: {timeAgo(stats.lastSummaryAt)}
        </p>
      )}

      {/* Run full pipeline card */}
      <div
        className="cos-card"
        style={{
          padding: 18,
          background: "linear-gradient(180deg, color-mix(in srgb, var(--signal) 6%, transparent), var(--surface) 60%)",
          borderColor: "rgba(74,222,128,.2)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            style={{ width: 44, height: 44, borderRadius: 8, background: "var(--signal-dim)", border: "1px solid rgba(74,222,128,.2)", color: "var(--signal)", display: "grid", placeItems: "center", flexShrink: 0 }}
          >
            <Play style={{ width: 18, height: 18 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 2 }}>Run full pipeline</div>
            <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--fg-4)" }}>
              collect → process → summarize → ideate
            </div>
          </div>
          <button
            onClick={runAll}
            disabled={isAnyRunning}
            className="cos-btn-primary"
            style={{ padding: "11px 22px", fontSize: 13, fontWeight: 700 }}
          >
            {fullRunning ? (
              <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> Running {progress + 1}/4…</>
            ) : (
              <><Play style={{ width: 13, height: 13 }} /> Run all</>
            )}
          </button>
        </div>
        {progress >= 0 && (
          <div style={{ marginTop: 14, height: 3, background: "var(--surface-2)", borderRadius: 99, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                background: "var(--signal)",
                width: `${Math.min(100, ((progress + 1) / 4) * 100)}%`,
                transition: "width 600ms ease",
              }}
            />
          </div>
        )}
      </div>

      {/* Individual steps */}
      <div className="cos-divider">Or run a single step</div>
      <div className="space-y-2">
        {STEPS.map((step, i) => {
          const result = results[step.id];
          const isRunning = result?.status === "running";
          const isDone = result?.status === "done";
          const color = TONE_COLORS[step.tone];
          const bg = TONE_BG[step.tone];
          const borderColor = TONE_BORDER[step.tone];

          return (
            <div key={step.id}>
              <div
                className={`cos-runner-step ${isDone ? "done" : ""}`}
                style={{ borderLeft: `3px solid ${isDone ? "rgba(74,222,128,0.5)" : (borderColor ?? "var(--hairline)")}` }}
              >
                <div className="cos-step-num" style={isDone ? undefined : { color, background: bg, border: `1px solid ${borderColor}` }}>
                  {isDone ? "✓" : step.num}
                </div>
                <div className="cos-step-info">
                  <h4 style={isRunning ? { color: "var(--signal)" } : undefined}>{step.label}</h4>
                  <p>{step.desc}</p>
                  {result && result.status !== "running" && (
                    <div
                      className="flex items-center gap-1.5 mt-2"
                      style={{ fontSize: 11.5, color: isDone ? "var(--signal)" : "var(--rose)" }}
                    >
                      {isDone ? (
                        <CheckCircle2 style={{ width: 12, height: 12, flexShrink: 0 }} />
                      ) : (
                        <XCircle style={{ width: 12, height: 12, flexShrink: 0 }} />
                      )}
                      {result.message}
                    </div>
                  )}
                </div>
                <div className="cos-step-stat">
                  <span style={{ color, fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 600 }}>{step.stat(stats)}</span>
                  <button
                    onClick={() => runStep(step.endpoint, step.id)}
                    disabled={isAnyRunning}
                    className="cos-btn-ghost"
                    style={{ fontSize: 10.5 }}
                  >
                    {isRunning ? (
                      <><Loader2 style={{ width: 11, height: 11 }} className="animate-spin" /> Running</>
                    ) : (
                      <><Play style={{ width: 11, height: 11 }} /> Run</>
                    )}
                  </button>
                </div>
              </div>
              {i < STEPS.length - 1 && <div className="cos-connector" />}
            </div>
          );
        })}
      </div>

      {/* How it works */}
      <div className="cos-divider">How the pipeline works</div>
      <div className="cos-card" style={{ padding: "16px 20px", fontSize: 12.5, lineHeight: 1.65, color: "var(--fg-3)" }}>
        <p style={{ marginBottom: 10 }}>
          <span style={{ fontFamily: "var(--font-geist-mono)", color: "var(--signal-2)", letterSpacing: "0.04em", fontSize: 11 }}>1. COLLECT</span>: Hits Nitter RSS feeds for all active accounts. Filters noise (GM posts, giveaway spam). New tweets land in Supabase.
        </p>
        <p style={{ marginBottom: 10 }}>
          <span style={{ fontFamily: "var(--font-geist-mono)", color: "var(--ronin)", letterSpacing: "0.04em", fontSize: 11 }}>2. PROCESS</span>: Sends unprocessed tweets to Groq (LLaMA 70B) for classification. Events scoring ≥5 are stored. Similar events clustered together.
        </p>
        <p style={{ marginBottom: 10 }}>
          <span style={{ fontFamily: "var(--font-geist-mono)", color: "var(--amber)", letterSpacing: "0.04em", fontSize: 11 }}>3. SUMMARIZE</span>: Generates a 4h ecosystem briefing from top events. Tagged with overall takeaway and per-ecosystem bullets.
        </p>
        <p>
          <span style={{ fontFamily: "var(--font-geist-mono)", color: "var(--violet)", letterSpacing: "0.04em", fontSize: 11 }}>4. IDEATE</span>: Creates content opportunities from top-scored events. Each idea gets a category, potential rating, and angle.
        </p>
      </div>
    </div>
  );
}
