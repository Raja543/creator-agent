"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Clock, ChevronDown } from "lucide-react";
import { ECO_HEADING, ECO_TEXT, ECO_BADGE } from "@/lib/ecosystem-colors";

interface Summary {
  id: string;
  content: string;
  created_at: string;
  timeframe?: string;
}

const ECOSYSTEMS = ["RONIN", "IMMUTABLE", "ABSTRACT"] as const;

const ECO_DOT: Record<string, string> = {
  RONIN: "bg-sky-400",
  IMMUTABLE: "bg-purple-400",
  ABSTRACT: "bg-emerald-400",
};

function parseUTC(iso: string): Date {
  const hasZone = iso.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(iso);
  return new Date(hasZone ? iso : iso + "Z");
}

function formatTime(iso: string) {
  return (
    parseUTC(iso).toLocaleString([], {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }) + " UTC"
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - parseUTC(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function parseSections(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const parts = content.split(/\n\n(?=[A-Z]+\n)/);
  for (const part of parts) {
    const lines = part.trim().split("\n");
    const heading = lines[0];
    result[heading] = lines.slice(1).join("\n").trim();
  }
  return result;
}

function ReportCard({ summary, index, total }: {
  summary: Summary;
  index: number;
  total: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const sections = parseSections(summary.content);
  const overall = sections["OVERALL"] ?? "";

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-black/25 transition-all duration-200">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-foreground">
                  Intel Report #{total - index}
                </span>
                {summary.timeframe && (
                  <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                    {summary.timeframe}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>{timeAgo(summary.created_at)}</span>
                <span className="text-border">·</span>
                <span>{formatTime(summary.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Ecosystem coverage dots */}
          <div className="flex items-center gap-1.5 shrink-0">
            {ECOSYSTEMS.map((eco) => (
              sections[eco] ? (
                <div key={eco} className="flex items-center gap-1">
                  <div className={`size-2 rounded-full ${ECO_DOT[eco]}`} />
                  <span className={`text-xs font-medium hidden sm:block ${ECO_TEXT[eco.toLowerCase()]}`}>
                    {eco.charAt(0) + eco.slice(1).toLowerCase()}
                  </span>
                </div>
              ) : null
            ))}
          </div>
        </div>

        {/* OVERALL — always visible */}
        {overall && (
          <div className="bg-gradient-to-br from-amber-400/10 to-amber-400/5 border border-amber-400/20 rounded-xl p-4 mt-1">
            <p className="text-xs font-black uppercase tracking-widest text-amber-400 mb-2">
              ⚡ Overall Takeaway
            </p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {overall}
            </p>
          </div>
        )}

        {/* Expand toggle */}
        {(sections["RONIN"] || sections["IMMUTABLE"] || sections["ABSTRACT"]) && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="size-3.5" />
            </motion.div>
            {expanded ? "Hide ecosystem breakdown" : "View ecosystem breakdown"}
          </button>
        )}
      </div>

      {/* Detailed breakdown */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="breakdown"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              {ECOSYSTEMS.map((eco) => {
                const body = sections[eco];
                if (!body) return null;
                return (
                  <div key={eco} className="px-5 py-4 border-b border-border/50 last:border-b-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`size-1.5 rounded-full ${ECO_DOT[eco]}`} />
                      <p className={`text-xs font-bold uppercase tracking-widest ${ECO_HEADING[eco]}`}>
                        {eco}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${ECO_BADGE[eco.toLowerCase()]}`}>
                        {eco.charAt(0) + eco.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed pl-3.5">
                      {body}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SummariesClient({ summaries }: { summaries: Summary[] }) {
  if (!summaries.length) {
    return (
      <div className="bg-card border border-border rounded-2xl py-24 flex flex-col items-center gap-4">
        <div className="size-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <FileText className="size-7 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-foreground">No reports yet</p>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
            Run the pipeline from the admin panel to generate your first intelligence report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {summaries.map((summary, index) => (
        <ReportCard
          key={summary.id}
          summary={summary}
          index={index}
          total={summaries.length}
        />
      ))}
    </div>
  );
}
