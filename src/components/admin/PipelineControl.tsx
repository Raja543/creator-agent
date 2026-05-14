"use client";

import { useState } from "react";
import {
  Radio,
  Cpu,
  FileText,
  Lightbulb,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  Clock,
  Database,
} from "lucide-react";

interface Stats {
  totalTweets: number;
  unprocessedTweets: number;
  totalEvents: number;
  totalIdeas: number;
  lastSummaryAt: string | null;
}

type StepStatus = "idle" | "running" | "done" | "error";

interface StepResult {
  status: StepStatus;
  message: string;
}

const STEPS = [
  {
    id: "collect",
    label: "Collect Tweets",
    description: "Scrape Nitter RSS feeds for all active accounts",
    icon: Radio,
    endpoint: "/api/pipeline/collect",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    id: "process",
    label: "Process Events",
    description: "Run Gemini AI classification on unprocessed tweets",
    icon: Cpu,
    endpoint: "/api/pipeline/process",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
  },
  {
    id: "summarize",
    label: "Generate Summary",
    description: "Create ecosystem intelligence report from last 4h events",
    icon: FileText,
    endpoint: "/api/pipeline/summarize",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  {
    id: "ideas",
    label: "Generate Ideas",
    description: "Create content opportunities from today's top events",
    icon: Lightbulb,
    endpoint: "/api/pipeline/ideas",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
];

export function PipelineControl({ stats }: { stats: Stats }) {
  const [results, setResults] = useState<Record<string, StepResult>>({});
  const [fullRunning, setFullRunning] = useState(false);

  async function runStep(endpoint: string, id: string) {
    setResults((r) => ({ ...r, [id]: { status: "running", message: "Running..." } }));
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const msg = data.message ?? formatResult(id, data);
      setResults((r) => ({ ...r, [id]: { status: "done", message: msg } }));
    } catch (err) {
      setResults((r) => ({
        ...r,
        [id]: { status: "error", message: err instanceof Error ? err.message : "Error" },
      }));
    }
  }

  async function runAll() {
    setFullRunning(true);
    for (const step of STEPS) {
      await runStep(step.endpoint, step.id);
      // Small gap between steps
      await new Promise((r) => setTimeout(r, 1000));
    }
    setFullRunning(false);
  }

  const isAnyRunning = fullRunning || Object.values(results).some((r) => r.status === "running");

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Tweets", value: stats.totalTweets, icon: Database },
          { label: "Unprocessed", value: stats.unprocessedTweets, icon: Cpu, highlight: stats.unprocessedTweets > 0 },
          { label: "Events", value: stats.totalEvents, icon: Zap },
          { label: "Ideas", value: stats.totalIdeas, icon: Lightbulb },
        ].map((s) => (
          <div key={s.label} className={`bg-card border rounded-xl p-4 ${s.highlight ? "border-amber-400/30" : "border-border"}`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`size-3.5 ${s.highlight ? "text-amber-400" : "text-muted-foreground"}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.highlight ? "text-amber-400" : "text-foreground"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {stats.lastSummaryAt && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          Last summary: {formatTime(stats.lastSummaryAt)}
        </div>
      )}

      {/* Run all button */}
      <button
        onClick={runAll}
        disabled={isAnyRunning}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {fullRunning ? (
          <><Loader2 className="size-4 animate-spin" /> Running full pipeline...</>
        ) : (
          <><Play className="size-4" /> Run Full Pipeline (Collect → Process → Summarize → Ideas)</>
        )}
      </button>

      {/* Individual steps */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Or run individually</p>
        {STEPS.map((step) => {
          const result = results[step.id];
          const isRunning = result?.status === "running";
          return (
            <div key={step.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-4">
                <div className={`size-9 rounded-lg ${step.bg} flex items-center justify-center shrink-0`}>
                  <step.icon className={`size-4 ${step.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground text-sm">{step.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    </div>
                    <button
                      onClick={() => runStep(step.endpoint, step.id)}
                      disabled={isAnyRunning}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground hover:border-border/60 transition-colors disabled:opacity-50"
                    >
                      {isRunning ? (
                        <><Loader2 className="size-3 animate-spin" /> Running</>
                      ) : (
                        <><Play className="size-3" /> Run</>
                      )}
                    </button>
                  </div>

                  {result && result.status !== "running" && (
                    <div className={`flex items-start gap-1.5 mt-2 text-xs ${result.status === "done" ? "text-green-400" : "text-destructive"}`}>
                      {result.status === "done" ? (
                        <CheckCircle2 className="size-3.5 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="size-3.5 mt-0.5 shrink-0" />
                      )}
                      {result.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* How it works */}
      <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-3">
        <p className="text-sm font-medium text-foreground">How the pipeline works</p>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p><span className="text-blue-400 font-medium">1. Collect</span> — Hits Nitter RSS feeds for all 64 accounts. Filters noise (GM posts, giveaways). Stores new tweets in Supabase.</p>
          <p><span className="text-violet-400 font-medium">2. Process</span> — Sends unprocessed tweets to Gemini Flash for classification. Events scoring ≥6 are stored. Similar events are clustered together.</p>
          <p><span className="text-cyan-400 font-medium">3. Summarize</span> — Takes the last 4 hours of events and generates an ecosystem intelligence report by ecosystem.</p>
          <p><span className="text-amber-400 font-medium">4. Ideas</span> — Analyzes today's top events and generates 5 creator content opportunities with format + angle.</p>
        </div>
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          All free — Nitter RSS (no API key), Gemini Flash free tier (1M tokens/day).
        </p>
      </div>
    </div>
  );
}

function formatResult(id: string, data: Record<string, unknown>): string {
  if (id === "collect") return `Collected ${data.collected} tweets from ${data.accounts} accounts (${data.skipped} noise filtered)`;
  if (id === "process") return `Processed ${data.processed} tweets → ${data.events_created} new events created`;
  if (id === "summarize") return `Summary generated from ${data.event_count} events`;
  if (id === "ideas") return `${data.ideas_created} content ideas created`;
  return JSON.stringify(data);
}

function parseUTC(iso: string): Date {
  const hasZone = iso.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(iso);
  return new Date(hasZone ? iso : iso + "Z");
}

function formatTime(iso: string) {
  const diff = Date.now() - parseUTC(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}
