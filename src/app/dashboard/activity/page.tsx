import { createClient } from "@/lib/supabase-server";
import { getRequestUserId } from "@/lib/auth-headers";
import type { ActivityType } from "@/lib/database.types";
import { formatTime, formatActivityDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

function groupByDate(items: { id: string; type: ActivityType | null; message: string | null; created_at: string }[]) {
  const groups: Map<string, typeof items> = new Map();
  for (const item of items) {
    const key = formatActivityDate(item.created_at);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return groups;
}

const KIND_MAP: Record<string, { kind: string; label: string }> = {
  event_detected:   { kind: "event",  label: "event detected" },
  event_clustered:  { kind: "event",  label: "cluster" },
  idea_generated:   { kind: "idea",   label: "idea" },
  pipeline_moved:   { kind: "pipe",   label: "pipeline" },
  summary_generated:{ kind: "report", label: "report" },
  source_added:     { kind: "pipe",   label: "source" },
  source_updated:   { kind: "pipe",   label: "source" },
  tweet_collected:  { kind: "system", label: "collect" },
  system:           { kind: "system", label: "system" },
};

function kindColor(kind: string) {
  if (kind === "event")  return "var(--signal-2)";
  if (kind === "idea")   return "var(--violet)";
  if (kind === "pipe")   return "var(--ronin)";
  if (kind === "report") return "var(--amber)";
  return "var(--fg-5)";
}

export default async function ActivityPage() {
  const [userId, supabase] = await Promise.all([getRequestUserId(), createClient()]);

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId!)
    .order("created_at", { ascending: false })
    .limit(100);

  const activities = data ?? [];
  const groups = groupByDate(activities);

  return (
    <div className="cos-page space-y-4">
      <div className="cos-page-head">
        <div className="cos-eyebrow">LIVE · {activities.length} EVENTS · TODAY</div>
        <h1 className="cos-page-title">Activity feed</h1>
        <p className="cos-page-sub">System events and pipeline changes, chronological, all kinds.</p>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "var(--rose-dim)", color: "var(--rose)", border: "1px solid rgba(244,63,94,.2)" }}>
          Failed to load activity: {error.message}
        </div>
      )}

      {activities.length === 0 ? (
        <div className="cos-card py-24 flex flex-col items-center gap-4" style={{ textAlign: "center" }}>
          <div className="size-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--signal-dim)", color: "var(--signal)" }}>
            <svg className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>No activity yet</p>
            <p style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 6, maxWidth: 260 }}>
              Activity appears as the system collects data, detects events, and generates content ideas.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(groups.entries()).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="cos-divider">{dateLabel} <span style={{ color: "var(--fg-5)", letterSpacing: 0, textTransform: "none", fontFamily: "inherit" }}>· {items.length}</span></div>
              <div className="cos-card">
                {items.map((activity) => {
                  const cfg = activity.type ? (KIND_MAP[activity.type] ?? { kind: "system", label: activity.type }) : { kind: "system", label: "system" };
                  return (
                    <div key={activity.id} className="cos-log-row">
                      <div className="cos-log-meta">
                        <span className="cos-log-time">{formatTime(activity.created_at)}</span>
                        <span className={`cos-log-kind ${cfg.kind}`} style={{ color: kindColor(cfg.kind) }}>
                          {cfg.label}
                        </span>
                      </div>
                      <span className="cos-log-body">{activity.message ?? "No message"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <p style={{ textAlign: "center", fontFamily: "var(--font-geist-mono)", fontSize: 10.5, color: "var(--fg-5)" }}>
            Showing latest {activities.length} activities
          </p>
        </div>
      )}
    </div>
  );
}
