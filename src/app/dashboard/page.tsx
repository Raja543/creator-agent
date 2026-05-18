import { supabase } from "@/lib/supabase";
import { Radio, Zap, Lightbulb, Activity, FileText, Play } from "lucide-react";
import Link from "next/link";
import { formatRelativeShort, formatTimestamp } from "@/lib/dates";
import { scoreClass } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Generates 6 sparkline points trending from prev→curr with subtle wave
function trendPoints(prev: number, curr: number): number[] {
  const offsets = [0, 0.1, 0.28, 0.5, 0.75, 1.0];
  const wave =    [0, -0.08, 0.06, -0.04, 0.09, 0];
  const base = Math.max(prev, curr, 1);
  return offsets.map((t, i) => Math.max(0, prev + (curr - prev) * t + wave[i] * base * 0.18));
}

function Sparkline({ pts, color }: { pts: number[]; color: string }) {
  const w = 200, h = 44;
  const max = Math.max(...pts, 1);
  const min = Math.min(...pts, 0);
  const range = max - min || 1;
  const coords = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x},${y}`;
  });
  const linePath = `M ${coords.join(" L ")}`;
  const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace(/[^a-z0-9]/gi, "")})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getData() {
  const nowMs = Date.now();
  const [
    sources,
    events24h,
    events24_48h,
    totalIdeas,
    activities,
    recentEvents,
    latestSummaryRes,
    pipelineCounts,
  ] = await Promise.all([
    supabase.from("accounts").select("id", { count: "exact" }).eq("active", true),
    supabase.from("events").select("id", { count: "exact" }).gte("created_at", new Date(nowMs - 86400000).toISOString()),
    supabase.from("events").select("id", { count: "exact" })
      .gte("created_at", new Date(nowMs - 172800000).toISOString())
      .lt("created_at", new Date(nowMs - 86400000).toISOString()),
    supabase.from("content_ideas").select("id", { count: "exact" }),
    supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(6),
    supabase.from("events").select("*").order("created_at", { ascending: false }).limit(14),
    supabase.from("summaries").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    Promise.all([
      supabase.from("content_ideas").select("id", { count: "exact" }).eq("status", "idea"),
      supabase.from("content_ideas").select("id", { count: "exact" }).eq("status", "draft"),
      supabase.from("content_ideas").select("id", { count: "exact" }).eq("status", "preparing"),
      supabase.from("content_ideas").select("id", { count: "exact" }).eq("status", "review"),
    ]),
  ]);

  const [ideaCount, draftCount, prepCount, revCount] = pipelineCounts;
  const srcCount  = sources.count ?? 0;
  const evtCount  = events24h.count ?? 0;
  const prevEvt   = events24_48h.count ?? 0;
  const ideaTotal = totalIdeas.count ?? 0;

  return {
    sourceCount:    srcCount,
    eventCount:     evtCount,
    eventDelta:     evtCount - prevEvt,
    prevEventCount: prevEvt,
    ideaTotal,
    ideaDraft:      draftCount.count ?? 0,
    activities:     activities.data ?? [],
    recentEvents:   recentEvents.data ?? [],
    summary:        latestSummaryRes.data ?? null,
    pipelineCounts: {
      idea:  ideaCount.count ?? 0,
      draft: draftCount.count ?? 0,
      prep:  prepCount.count ?? 0,
      rev:   revCount.count ?? 0,
    },
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EcoChip({ eco }: { eco: string }) {
  return <span className={`cos-eco ${eco}`}>{eco}</span>;
}

function ScoreBadge({ n }: { n: number | null }) {
  return <span className={`cos-score ${scoreClass(n)}`}>{n ?? "—"}</span>;
}

function Delta({ v }: { v: number }) {
  if (v === 0) return null;
  const sign = v > 0 ? "+" : "";
  return (
    <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 600, color: v > 0 ? "var(--signal)" : "var(--rose)" }}>
      {v > 0 ? "↗" : "↘"} {sign}{v}
    </span>
  );
}

function ActivityRow({ a }: { a: { id: string; created_at: string; type: string | null; message: string | null } }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "7px 14px", borderBottom: "1px solid var(--hairline)",
    }}>
      <span style={{
        fontFamily: "var(--font-geist-mono)", fontSize: 10, color: "var(--fg-5)",
        whiteSpace: "nowrap", paddingTop: 2, minWidth: 28, flexShrink: 0,
      }}>{formatRelativeShort(a.created_at)}</span>
      <span style={{ fontSize: 11.5, color: "var(--fg-2)", lineHeight: 1.45, flex: 1, minWidth: 0 }}>{a.message ?? ""}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const data = await getData();
  const totalPipeline = data.pipelineCounts.idea + data.pipelineCounts.draft + data.pipelineCounts.prep + data.pipelineCounts.rev;

  // Date label — "16th May Saturday"
  const today = new Date();
  const days   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  function ordinal(n: number) {
    const s = ["th","st","nd","rd"]; const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  const dateLabel = `${ordinal(today.getDate())} ${months[today.getMonth()]} · ${days[today.getDay()]}`;

  // Dynamic headline
  const signals = data.eventCount;
  const headline = signals === 0
    ? "The desk is quiet."
    : `The desk is open. ${signals} signal${signals !== 1 ? "s" : ""} in the last 24 hours.`;

  // Active ecosystems for chips below headline
  const ecoSet = new Set(data.recentEvents.map((e: { ecosystem?: string | null }) => e.ecosystem).filter((e): e is string => !!e));
  const activeEcos = [...ecoSet];

  // Parse summary using the same logic as the reports page (SummariesClient)
  const parsedSummary = (() => {
    const s = data.summary as { content?: string } | null;
    if (!s?.content) return null;
    // Mirror parseSections() from SummariesClient exactly
    const sections: Record<string, string> = {};
    try {
      const parsed = JSON.parse(s.content) as Record<string, unknown>;
      for (const [k, v] of Object.entries(parsed))
        if (typeof v === "string") sections[k.toUpperCase()] = v;
    } catch {
      const parts = s.content.split(/\n\n(?=[A-Z]+\n)/);
      for (const part of parts) {
        const lines = part.trim().split("\n");
        sections[lines[0]] = lines.slice(1).join("\n").trim();
      }
    }
    const overall = sections["OVERALL"] ?? sections["overall"] ?? "";
    return { overall, sections };
  })();

  function highlightEcos(text: string) {
    const parts = text.split(/\b(Ronin|Immutable|Abstract)\b/gi);
    return parts.map((part, i) => {
      const up = part.toUpperCase();
      if (up === "RONIN")     return <span key={i} style={{ color: "#3b82f6", fontWeight: 700 }}>{part}</span>;
      if (up === "IMMUTABLE") return <span key={i} style={{ color: "#a855f7", fontWeight: 700 }}>{part}</span>;
      if (up === "ABSTRACT")  return <span key={i} style={{ color: "#10b981", fontWeight: 700 }}>{part}</span>;
      return part;
    });
  }

  const summaryTimestamp = (() => {
    const s = data.summary as { created_at?: string } | null;
    if (!s?.created_at) return "";
    return formatTimestamp(s.created_at);
  })();


  // Sparkline data
  const eventPts  = trendPoints(data.prevEventCount, data.eventCount);
  const sourcePts = trendPoints(Math.max(data.sourceCount - 3, 0), data.sourceCount);
  const ideaPts   = trendPoints(Math.max(data.ideaTotal - Math.abs(data.eventDelta) * 2, 0), data.ideaTotal);

  return (
    <div style={{ paddingBottom: 32 }}>

      {/* ── Ticker ────────────────────────────────────────────────────────── */}
      {data.recentEvents.length > 0 && (
        <div className="cos-ticker">
          <div className="cos-ticker-label">
            <span className="dot" />
            LIVE
          </div>
          <div className="cos-ticker-scroll">
            {[...data.recentEvents, ...data.recentEvents].map((ev, i) => (
              <div key={i} className="cos-ticker-item">
                {ev.ecosystem && (() => {
                  const ecoKey = ev.ecosystem.toLowerCase();
                  const palette: Record<string, { bg: string; color: string }> = {
                    ronin:     { bg: "rgba(59,130,246,0.15)",  color: "#3b82f6" },
                    immutable: { bg: "rgba(168,85,247,0.15)", color: "#a855f7" },
                    abstract:  { bg: "rgba(16,185,129,0.15)", color: "#10b981" },
                  };
                  const p = palette[ecoKey] ?? { bg: "rgba(255,255,255,0.08)", color: "var(--fg-4)" };
                  return (
                    <span style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase" as const,
                      padding: "3px 9px",
                      borderRadius: 4,
                      background: p.bg,
                      color: p.color,
                      flexShrink: 0,
                    }}>
                      {ev.ecosystem}
                    </span>
                  );
                })()}
                <span style={{ color: "#ffffff", fontSize: 13, fontWeight: 600 }}>{ev.title ?? "Signal"}</span>
                {ev.importance_score != null && (
                  <span className={`score ${ev.importance_score >= 8 ? "high" : "mid"}`}>↗ {ev.importance_score}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="cos-page space-y-4" style={{ paddingTop: 20 }}>

        {/* ── Headline ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="cos-eyebrow">{dateLabel}</div>
            <h1 className="cos-headline-title">{headline}</h1>
            {/* Ecosystem chips */}
            {activeEcos.length > 0 && (
              <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 6, margin: "16px 0 16px" }}>
                {activeEcos.map((eco) => {
                  const key = eco.toLowerCase();
                  const palette: Record<string, { bg: string; color: string; border: string }> = {
                    ronin:     { bg: "rgba(59,130,246,0.12)",  color: "#3b82f6", border: "rgba(59,130,246,0.28)" },
                    immutable: { bg: "rgba(168,85,247,0.12)", color: "#a855f7", border: "rgba(168,85,247,0.28)" },
                    abstract:  { bg: "rgba(16,185,129,0.12)", color: "#10b981", border: "rgba(16,185,129,0.28)" },
                  };
                  const p = palette[key] ?? { bg: "rgba(255,255,255,0.06)", color: "var(--fg-4)", border: "rgba(255,255,255,0.1)" };
                  return (
                    <span key={eco} style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontFamily: "var(--font-geist-mono)", fontSize: 10.5, fontWeight: 700,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      padding: "4px 10px", borderRadius: 6,
                      background: p.bg, color: p.color, border: `1px solid ${p.border}`,
                      flexShrink: 0,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                      {eco}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 sm:pt-[18px]">
            <Link
              href="/admin/pipeline"
              className="cos-btn-primary"
              style={{ padding: "8px 16px", fontSize: 12, gap: 6, background: "var(--signal)", color: "var(--primary-foreground)", fontWeight: 700, display: "flex", alignItems: "center" }}
            >
              <Play style={{ width: 12, height: 12 }} />
              Run pipeline
            </Link>
          </div>
        </div>

        {/* ── KPI grid ──────────────────────────────────────────────────────── */}
        <div className="cos-kpi-grid">

          {/* Sources */}
          <Link
            href="/dashboard/sources"
            className="cos-kpi block"
            style={{
              background: "linear-gradient(150deg, rgba(6,182,212,0.1) 0%, var(--surface) 55%)",
              paddingBottom: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "16px 16px 0" }}>
              <div className="cos-kpi-label" style={{ color: "rgba(6,182,212,0.7)" }}>
                <Radio style={{ width: 12, height: 12 }} />
                Active Sources
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                <span className="cos-kpi-value" style={{ color: "#06b6d4" }}>{data.sourceCount}</span>
              </div>
              <div className="cos-kpi-note" style={{ marginBottom: 10 }}>{data.sourceCount} of {data.sourceCount} active</div>
            </div>
            <div style={{ marginTop: "auto" }}>
              <Sparkline pts={sourcePts} color="#06b6d4" />
            </div>
          </Link>

          {/* Events */}
          <Link
            href="/dashboard/events"
            className="cos-kpi block"
            style={{
              background: "linear-gradient(150deg, rgba(245,158,11,0.1) 0%, var(--surface) 55%)",
              paddingBottom: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "16px 16px 0" }}>
              <div className="cos-kpi-label" style={{ color: "rgba(245,158,11,0.7)" }}>
                <Zap style={{ width: 12, height: 12 }} />
                Events · 24H
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                <span className="cos-kpi-value" style={{ color: "#f59e0b" }}>{data.eventCount}</span>
                {data.eventDelta > 0 && <Delta v={data.eventDelta} />}
              </div>
              <div className="cos-kpi-note" style={{ marginBottom: 10 }}>vs prev 24h</div>
            </div>
            <div style={{ marginTop: "auto" }}>
              <Sparkline pts={eventPts} color="#f59e0b" />
            </div>
          </Link>

          {/* Ideas */}
          <Link
            href="/dashboard/ideas"
            className="cos-kpi block"
            style={{
              background: "linear-gradient(150deg, rgba(139,92,246,0.1) 0%, var(--surface) 55%)",
              paddingBottom: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "16px 16px 0" }}>
              <div className="cos-kpi-label" style={{ color: "rgba(139,92,246,0.7)" }}>
                <Lightbulb style={{ width: 12, height: 12 }} />
                Content Ideas
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                <span className="cos-kpi-value" style={{ color: "#8b5cf6" }}>{data.ideaTotal}</span>
                {data.ideaDraft > 0 && (
                  <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, color: "var(--signal)" }}>↗ +{data.ideaDraft}</span>
                )}
              </div>
              <div className="cos-kpi-note" style={{ marginBottom: 10 }}>{data.pipelineCounts.draft} in draft</div>
            </div>
            <div style={{ marginTop: "auto" }}>
              <Sparkline pts={ideaPts} color="#8b5cf6" />
            </div>
          </Link>

          {/* System Status */}
          <div
            className="cos-kpi"
            style={{
              background: "linear-gradient(150deg, rgba(74,222,128,0.07) 0%, var(--surface) 55%)",
              paddingBottom: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "16px 16px 0" }}>
              <div className="cos-kpi-label" style={{ color: "rgba(74,222,128,0.7)" }}>
                <Activity style={{ width: 12, height: 12 }} />
                System Status
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                <span className="cos-kpi-value" style={{ color: "#4ade80" }}>LIVE</span>
              </div>
              <div className="cos-kpi-note" style={{ marginBottom: 10 }}>4 / 4 services online</div>
            </div>
            <div style={{ marginTop: "auto" }}>
              <Sparkline pts={[1,1,1,1,1,1]} color="#4ade80" />
            </div>
          </div>
        </div>

        {/* ── Last intel report ─────────────────────────────────────────────── */}
        {parsedSummary ? (
          <div className="cos-briefing">
            <div className="cos-briefing-head">
              <div className="cos-briefing-eyebrow">
                <span className="cos-briefing-dot" />
                AI BRIEFING
                <span style={{ color: "var(--fg-5)" }}>·</span>
                INTEL REPORT
                {summaryTimestamp && <><span style={{ color: "var(--fg-5)" }}>·</span> {summaryTimestamp}</>}
              </div>
              <Link href="/dashboard/summaries" className="cos-btn-ghost" style={{ fontSize: 11 }}>
                Open report →
              </Link>
            </div>
            {parsedSummary.overall && (
              <div className="cos-briefing-body">
                <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--fg)", margin: 0 }}>
                  {highlightEcos(parsedSummary.overall)}
                </p>
              </div>
            )}
            <div className="cos-briefing-foot">
              <Link href="/dashboard/summaries" style={{ color: "var(--fg-4)", textDecoration: "none", fontFamily: "var(--font-geist-mono)", fontSize: 10, letterSpacing: "0.06em" }}>
                READ FULL REPORT →
              </Link>
              {["RONIN","IMMUTABLE","ABSTRACT"].filter(e => parsedSummary.sections[e]).map(e => {
                const colors: Record<string,string> = { RONIN:"#3b82f6", IMMUTABLE:"#a855f7", ABSTRACT:"#10b981" };
                return <span key={e} className="cos-briefing-angle" style={{ color: colors[e], background: `${colors[e]}18`, border: `1px solid ${colors[e]}30` }}>{e.charAt(0)+e.slice(1).toLowerCase()}</span>;
              })}
            </div>
          </div>
        ) : (
          <div className="cos-briefing" style={{ opacity: 0.45 }}>
            <div className="cos-briefing-head">
              <div className="cos-briefing-eyebrow">
                <span className="cos-briefing-dot" style={{ background: "var(--fg-5)", animation: "none" }} />
                INTEL REPORT
                <span style={{ color: "var(--fg-5)" }}>· no report yet</span>
              </div>
              <Link href="/admin/pipeline" className="cos-btn-ghost" style={{ fontSize: 11 }}>Generate →</Link>
            </div>
            <div className="cos-briefing-body">
              <p style={{ color: "var(--fg-4)", margin: 0 }}>Run the pipeline to generate your first intel report.</p>
            </div>
          </div>
        )}

        {/* ── Split grid: signal feed + sidebar ────────────────────────────── */}
        <div className="cos-split-grid">

          {/* Signal feed */}
          <div className="cos-card">
            <div className="cos-card-head">
              <div className="flex items-center gap-2">
                <span className="cos-card-title">Signal feed · last 24h</span>
                {data.eventCount > 0 && (
                  <span className="cos-chip signal">{data.eventCount} new</span>
                )}
              </div>
              <Link href="/dashboard/events" className="cos-btn-ghost" style={{ fontSize: 11 }}>All events →</Link>
            </div>
            {data.recentEvents.length === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 11.5, color: "var(--fg-4)", fontFamily: "var(--font-geist-mono)" }}>No events yet — run the pipeline.</p>
              </div>
            ) : (
              <div>
                {data.recentEvents.map((ev) => (
                  <div key={ev.id} className="cos-event-row">
                    <span className="cos-event-row-time">{formatRelativeShort(ev.created_at)}</span>
                    <ScoreBadge n={ev.importance_score} />
                    <span className="cos-event-row-title">{ev.title ?? "Untitled"}</span>
                    <div className="cos-event-row-tags">
                      {ev.ecosystem && <EcoChip eco={ev.ecosystem} />}
                      {ev.category && <span className="cos-chip">{ev.category}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: activity + pipeline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Activity */}
            <div className="cos-card">
              <div className="cos-card-head" style={{ padding: "10px 14px" }}>
                <span className="cos-card-title">Activity</span>
                <Link href="/dashboard/activity" className="cos-btn-ghost" style={{ fontSize: 10.5 }}>Log →</Link>
              </div>
              {data.activities.length === 0 ? (
                <div style={{ padding: "16px 14px", textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: "var(--fg-4)", fontFamily: "var(--font-geist-mono)" }}>No activity yet.</p>
                </div>
              ) : (
                <div>
                  {data.activities.map((a) => (
                    <ActivityRow key={a.id} a={a} />
                  ))}
                </div>
              )}
            </div>

            {/* Pipeline overview */}
            <div className="cos-card">
              <div className="cos-card-head" style={{ padding: "10px 14px" }}>
                <span className="cos-card-title">Pipeline · {totalPipeline} items</span>
                <Link href="/dashboard/pipeline" className="cos-btn-ghost" style={{ fontSize: 10.5 }}>Board →</Link>
              </div>
              <div className="cos-card-body" style={{ padding: "12px 14px" }}>
                {[
                  { label: "IDEA",    cls: "idea",  count: data.pipelineCounts.idea },
                  { label: "DRAFT",   cls: "draft", count: data.pipelineCounts.draft },
                  { label: "PREPARE", cls: "prep",  count: data.pipelineCounts.prep },
                  { label: "REVIEW",  cls: "rev",   count: data.pipelineCounts.rev },
                ].map((bar) => (
                  <div key={bar.label} className="cos-pipe-bar">
                    <span className="label">{bar.label}</span>
                    <div className="cos-pipe-track">
                      <div
                        className={`cos-pipe-fill ${bar.cls}`}
                        style={{ width: `${totalPipeline > 0 ? Math.min(100, (bar.count / totalPipeline) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="count">{bar.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Empty state / quick-start ─────────────────────────────────────── */}
        {data.sourceCount === 0 && (
          <div
            className="flex items-center gap-4 rounded-lg px-5 py-4"
            style={{ background: "var(--signal-glow)", border: "1px solid rgba(74,222,128,.15)" }}
          >
            <div className="size-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--signal-dim)", color: "var(--signal)" }}>
              <Radio className="size-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">Get started — add your first sources</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>
                Add X accounts to track, or use Admin → Manage Accounts to bulk-add by ecosystem.
              </p>
            </div>
            <Link href="/admin/accounts" className="cos-btn-primary shrink-0">Add Sources</Link>
          </div>
        )}

        {!data.summary && data.sourceCount > 0 && (
          <div
            className="flex items-center gap-4 rounded-lg px-5 py-4"
            style={{ background: "rgba(139,92,246,.05)", border: "1px solid rgba(139,92,246,.15)" }}
          >
            <div className="size-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--violet-dim)", color: "var(--violet)" }}>
              <FileText className="size-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">No intel reports yet</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>Run the full pipeline to generate your first ecosystem briefing.</p>
            </div>
            <Link href="/admin/pipeline" className="cos-btn-ghost">Run Pipeline →</Link>
          </div>
        )}

      </div>
    </div>
  );
}
