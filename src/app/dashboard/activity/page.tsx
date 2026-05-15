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
  { icon: React.ElementType; label: string; color: string; bg: string; glow: string }
> = {
  source_added: {
    icon: Radio,
    label: "Source Added",
    color: "text-blue-400",
    bg: "bg-gradient-to-br from-blue-400/20 to-blue-400/5",
    glow: "bg-blue-400",
  },
  source_updated: {
    icon: Radio,
    label: "Source Updated",
    color: "text-blue-400",
    bg: "bg-gradient-to-br from-blue-400/20 to-blue-400/5",
    glow: "bg-blue-400",
  },
  event_detected: {
    icon: Zap,
    label: "Event Detected",
    color: "text-violet-400",
    bg: "bg-gradient-to-br from-violet-400/20 to-violet-400/5",
    glow: "bg-violet-400",
  },
  event_clustered: {
    icon: Zap,
    label: "Events Clustered",
    color: "text-violet-400",
    bg: "bg-gradient-to-br from-violet-400/20 to-violet-400/5",
    glow: "bg-violet-400",
  },
  idea_generated: {
    icon: Lightbulb,
    label: "Idea Generated",
    color: "text-amber-400",
    bg: "bg-gradient-to-br from-amber-400/20 to-amber-400/5",
    glow: "bg-amber-400",
  },
  pipeline_moved: {
    icon: Columns3,
    label: "Pipeline Moved",
    color: "text-cyan-400",
    bg: "bg-gradient-to-br from-cyan-400/20 to-cyan-400/5",
    glow: "bg-cyan-400",
  },
  summary_generated: {
    icon: FileText,
    label: "Summary Generated",
    color: "text-green-400",
    bg: "bg-gradient-to-br from-green-400/20 to-green-400/5",
    glow: "bg-green-400",
  },
  tweet_collected: {
    icon: MessageSquare,
    label: "Tweet Collected",
    color: "text-sky-400",
    bg: "bg-gradient-to-br from-sky-400/20 to-sky-400/5",
    glow: "bg-sky-400",
  },
  system: {
    icon: Settings,
    label: "System",
    color: "text-muted-foreground",
    bg: "bg-muted",
    glow: "bg-muted",
  },
};

const DEFAULT_CONFIG = {
  icon: Activity,
  label: "Activity",
  color: "text-muted-foreground",
  bg: "bg-muted",
  glow: "bg-muted",
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
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Activity Feed</h1>
        <p className="text-sm text-muted-foreground mt-1">System events and pipeline changes</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">
          Failed to load activity: {error.message}
        </div>
      )}

      {activities.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-24 flex flex-col items-center gap-4">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Activity className="size-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
              Activity appears as the system collects data, detects events, and generates content ideas.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(groups.entries()).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-black uppercase tracking-widest text-foreground bg-card border border-border px-3 py-1 rounded-full">
                  {dateLabel}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>

              <div className="space-y-0.5">
                {items.map((activity, index) => {
                  const config = activity.type
                    ? (ACTIVITY_CONFIG[activity.type] ?? DEFAULT_CONFIG)
                    : DEFAULT_CONFIG;
                  const Icon = config.icon;
                  const isLast = index === items.length - 1;

                  return (
                    <div key={activity.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`relative size-10 rounded-xl ${config.bg} flex items-center justify-center overflow-hidden`}>
                          <div className={`absolute inset-0 opacity-0 ${config.glow} blur-sm`} />
                          <Icon className={`relative size-4 ${config.color}`} />
                        </div>
                        {!isLast && (
                          <div className="w-px flex-1 bg-gradient-to-b from-border to-transparent mt-1 min-h-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pb-4 pt-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-bold uppercase tracking-wide ${config.color}`}>
                              {config.label}
                            </span>
                            <p className="text-sm text-foreground mt-0.5 leading-relaxed">
                              {activity.message ?? "No message"}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 tabular-nums whitespace-nowrap">
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
