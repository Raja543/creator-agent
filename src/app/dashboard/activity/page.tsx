import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

import {
  Radio,
  Zap,
  Lightbulb,
  Columns3,
  FileText,
  MessageSquare,
  Settings,
  Activity,
} from "lucide-react";
import type { ActivityType } from "@/lib/database.types";

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: React.ElementType; label: string; color: string; bg: string }
> = {
  source_added: {
    icon: Radio,
    label: "Source Added",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  source_updated: {
    icon: Radio,
    label: "Source Updated",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  event_detected: {
    icon: Zap,
    label: "Event Detected",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
  },
  event_clustered: {
    icon: Zap,
    label: "Events Clustered",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
  },
  idea_generated: {
    icon: Lightbulb,
    label: "Idea Generated",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  pipeline_moved: {
    icon: Columns3,
    label: "Pipeline Moved",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  summary_generated: {
    icon: FileText,
    label: "Summary Generated",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  tweet_collected: {
    icon: MessageSquare,
    label: "Tweet Collected",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
  },
  system: {
    icon: Settings,
    label: "System",
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
};

const DEFAULT_CONFIG = {
  icon: Activity,
  label: "Activity",
  color: "text-muted-foreground",
  bg: "bg-muted",
};

function parseUTC(iso: string): Date {
  const hasZone = iso.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(iso);
  return new Date(hasZone ? iso : iso + "Z");
}

function formatTime(iso: string) {
  const date = parseUTC(iso);
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

function formatDate(iso: string) {
  const date = parseUTC(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function groupByDate(
  items: { id: string; type: ActivityType | null; message: string | null; created_at: string }[]
) {
  const groups: Map<string, typeof items> = new Map();
  for (const item of items) {
    const key = formatDate(item.created_at);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return groups;
}

export default async function ActivityPage() {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const activities = data ?? [];
  const groups = groupByDate(activities);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Activity Feed</h1>
        <p className="text-sm text-muted-foreground mt-1">System events and pipeline changes</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">
          Failed to load activity: {error.message}
        </div>
      )}

      {activities.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-24 flex flex-col items-center gap-3">
          <div className="size-14 rounded-full bg-muted flex items-center justify-center">
            <Activity className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground max-w-xs text-center">
            Activity will appear here as the system collects data, detects events, and generates content ideas.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(groups.entries()).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  {dateLabel}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>

              <div className="space-y-1">
                {items.map((activity, index) => {
                  const config = activity.type
                    ? (ACTIVITY_CONFIG[activity.type] ?? DEFAULT_CONFIG)
                    : DEFAULT_CONFIG;
                  const Icon = config.icon;
                  const isLast = index === items.length - 1;

                  return (
                    <div key={activity.id} className="flex items-start gap-4 group">
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`size-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                          <Icon className={`size-3.5 ${config.color}`} />
                        </div>
                        {!isLast && (
                          <div className="w-px flex-1 bg-border mt-1 min-h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-semibold uppercase tracking-wide ${config.color}`}>
                                {config.label}
                              </span>
                            </div>
                            <p className="text-sm text-foreground mt-0.5 leading-relaxed">
                              {activity.message ?? "No message"}
                            </p>
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5 tabular-nums">
                            {formatTime(activity.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              Showing latest {activities.length} activities
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
