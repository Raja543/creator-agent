"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ChevronDown, Flame } from "lucide-react";
import { timeAgo, formatTimestamp } from "@/lib/dates";

interface Summary {
  id: string;
  content: string;
  created_at: string;
  timeframe?: string;
}

const ECOSYSTEMS = ["RONIN", "IMMUTABLE", "ABSTRACT"] as const;

const ECO_VAR: Record<string, string> = {
  RONIN: "var(--ronin)",
  IMMUTABLE: "var(--immutable)",
  ABSTRACT: "var(--abstract)",
};


function parseSections(content: string): Record<string, string> {
  try {
    const parsed = JSON.parse(content);
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string") result[k.toUpperCase()] = v;
    }
    return result;
  } catch {
    const result: Record<string, string> = {};
    const parts = content.split(/\n\n(?=[A-Z]+\n)/);
    for (const part of parts) {
      const lines = part.trim().split("\n");
      result[lines[0]] = lines.slice(1).join("\n").trim();
    }
    return result;
  }
}

function ReportCard({ summary, index, total }: { summary: Summary; index: number; total: number }) {
  const [expanded, setExpanded] = useState(false);
  const sections = parseSections(summary.content);
  const overall = sections["OVERALL"] ?? sections["overall"] ?? "";
  const hasEcosystems = ECOSYSTEMS.some((eco) => sections[eco] || sections[eco.toLowerCase()]);

  return (
    <div className="cos-report-card">
      {/* Report header */}
      <div className="cos-report-head">
        <div className="cos-report-icon">
          <FileText style={{ width: 18, height: 18 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="cos-report-num">Intel Report · No. {String(total - index).padStart(3, "0")}</div>
          <div className="cos-report-title">{formatTimestamp(summary.created_at)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10.5, color: "var(--fg-4)" }}>
              {timeAgo(summary.created_at)}
            </span>
            {summary.timeframe && (
              <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, background: "rgba(255,255,255,.06)", color: "var(--fg-4)", padding: "2px 6px", borderRadius: 3 }}>
                {summary.timeframe}
              </span>
            )}
            {/* Ecosystem dots */}
            <div className="flex items-center gap-1.5">
              {ECOSYSTEMS.map((eco) => {
                const body = sections[eco] || sections[eco.toLowerCase()];
                if (!body) return null;
                return (
                  <span
                    key={eco}
                    style={{ width: 6, height: 6, borderRadius: "50%", background: ECO_VAR[eco], display: "inline-block" }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Overall takeaway */}
      {overall && (
        <div className="cos-takeaway">
          <div className="cos-takeaway-label">
            <Flame style={{ width: 12, height: 12 }} />
            Overall takeaway
          </div>
          <div className="cos-takeaway-body">{overall}</div>
        </div>
      )}

      {/* Expand toggle */}
      {hasEcosystems && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 mx-5 mb-3"
          style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10.5, color: "var(--fg-4)", letterSpacing: "0.06em", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown style={{ width: 12, height: 12 }} />
          </motion.div>
          {expanded ? "HIDE BREAKDOWN" : "VIEW ECOSYSTEM BREAKDOWN"}
        </button>
      )}

      {/* Ecosystem breakdown */}
      <AnimatePresence initial={false}>
        {expanded && hasEcosystems && (
          <motion.div
            key="breakdown"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden", borderTop: "1px solid var(--hairline)" }}
          >
            {ECOSYSTEMS.map((eco) => {
              const body = sections[eco] || sections[eco.toLowerCase()];
              if (!body) return null;
              const bullets = body.split("\n- ").map((b) => b.replace(/^- /, "").trim()).filter(Boolean);
              return (
                <div key={eco} className="cos-ecosys-block" style={{ marginTop: 14 }}>
                  <div className="cos-ecosys-label">
                    <span className={`cos-eco ${eco.toLowerCase()}`}>{eco}</span>
                    <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10.5, color: "var(--fg-4)" }}>
                      {bullets.length} signal{bullets.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {bullets.length > 0 ? bullets.map((bullet, i) => {
                    const hot = bullet.includes("🔥");
                    return (
                      <div key={i} className={`cos-ecosys-bullet ${hot ? "hot" : ""}`}>
                        <span className="b" />
                        <span>{bullet.replace("🔥", "").trim()}</span>
                        {hot && <span className="ann">HIGH SIGNAL</span>}
                      </div>
                    );
                  }) : (
                    <div className="cos-ecosys-bullet">
                      <span className="b" />
                      <span style={{ color: "var(--fg-4)" }}>{body}</span>
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ height: 14 }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SummariesClient({ summaries }: { summaries: Summary[] }) {
  if (!summaries.length) {
    return (
      <div className="cos-card py-24 flex flex-col items-center gap-4" style={{ textAlign: "center" }}>
        <div className="size-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--signal-dim)", color: "var(--signal)" }}>
          <FileText style={{ width: 24, height: 24 }} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>No reports yet</p>
          <p style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 6, maxWidth: 260 }}>
            Run the full pipeline from the admin panel to generate your first intelligence report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {summaries.map((summary, index) => (
        <ReportCard key={summary.id} summary={summary} index={index} total={summaries.length} />
      ))}
    </div>
  );
}
