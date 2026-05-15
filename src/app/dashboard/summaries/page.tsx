import { supabase } from "@/lib/supabase";
import { Clock, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

function parseUTC(iso: string): Date {
  const hasZone = iso.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(iso);
  return new Date(hasZone ? iso : iso + "Z");
}

function formatTime(iso: string) {
  const date = parseUTC(iso);
  return date.toLocaleString([], {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }) + " UTC";
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

const HEADING_COLORS: Record<string, string> = {
  RONIN: "text-blue-400",
  IMMUTABLE: "text-cyan-400",
  ABSTRACT: "text-violet-400",
  OVERALL: "text-amber-400",
};

function SummaryCard({ summary }: { summary: { id: string; content: string; created_at: string; timeframe?: string } }) {
  const sections = summary.content.split(/\n\n(?=[A-Z]+\n)/);

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Intelligence Report</span>
          {summary.timeframe && (
            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
              {summary.timeframe}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{timeAgo(summary.created_at)}</span>
          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            {formatTime(summary.created_at)}
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-1 border-t border-border">
        {sections.map((section: string) => {
          const lines = section.trim().split("\n");
          const heading = lines[0];
          const body = lines.slice(1).join("\n").trim();
          return (
            <div key={heading}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${HEADING_COLORS[heading] ?? "text-muted-foreground"}`}>
                {heading}
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {body}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function SummariesPage() {
  const { data: summaries } = await supabase
    .from("summaries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Intelligence Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {summaries?.length ?? 0} report{summaries?.length !== 1 ? "s" : ""} generated — updated every 4 hours
        </p>
      </div>

      {!summaries?.length ? (
        <div className="bg-card border border-border rounded-xl py-24 flex flex-col items-center gap-3">
          <FileText className="size-8 text-muted-foreground opacity-50" />
          <p className="text-sm font-medium text-foreground">No reports yet</p>
          <p className="text-xs text-muted-foreground">
            Run the pipeline from the admin panel to generate your first intelligence report.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {summaries.map((s) => (
            <SummaryCard key={s.id} summary={s} />
          ))}
        </div>
      )}
    </div>
  );
}
