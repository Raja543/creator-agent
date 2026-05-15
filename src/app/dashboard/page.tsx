import { supabase } from "@/lib/supabase";
import { Zap, Radio, Lightbulb, Activity, Clock } from "lucide-react";
import Link from "next/link";
import { ECO_BADGE } from "@/lib/ecosystem-colors";

export const dynamic = "force-dynamic";

async function getStats() {
  const [sources, events, ideas, activities] = await Promise.all([
    supabase.from("accounts").select("id", { count: "exact" }).eq("active", true),
    supabase.from("events").select("id", { count: "exact" }).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
    supabase.from("content_ideas").select("id", { count: "exact" }).eq("status", "idea"),
    supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(8),
  ]);

  return {
    sourceCount: sources.count ?? 0,
    eventCount: events.count ?? 0,
    ideaCount: ideas.count ?? 0,
    activities: activities.data ?? [],
  };
}

async function getRecentEvents() {
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

export default async function DashboardPage() {
  const [stats, recentEvents] = await Promise.all([
    getStats(),
    getRecentEvents(),
  ]);

  const statCards = [
    {
      label: "Active Sources",
      value: stats.sourceCount,
      icon: Radio,
      href: "/dashboard/sources",
      color: "text-blue-400",
      bg: "bg-gradient-to-br from-blue-400/20 to-blue-400/5",
      glow: "bg-blue-400",
    },
    {
      label: "Events Today",
      value: stats.eventCount,
      icon: Zap,
      href: "/dashboard/events",
      color: "text-amber-400",
      bg: "bg-gradient-to-br from-amber-400/20 to-amber-400/5",
      glow: "bg-amber-400",
    },
    {
      label: "Content Ideas",
      value: stats.ideaCount,
      icon: Lightbulb,
      href: "/dashboard/ideas",
      color: "text-violet-400",
      bg: "bg-gradient-to-br from-violet-400/20 to-violet-400/5",
      glow: "bg-violet-400",
    },
    {
      label: "System Status",
      value: "live",
      icon: Activity,
      href: "/dashboard/activity",
      color: "text-green-400",
      bg: "bg-gradient-to-br from-green-400/20 to-green-400/5",
      glow: "bg-green-400",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Good morning,{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Creator
          </span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your Web3 gaming intelligence is running
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="relative bg-card border border-border rounded-xl p-5 overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 transition-all duration-200 group"
          >
            {/* Ambient glow */}
            <div className={`absolute -top-4 -right-4 size-20 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 ${card.glow}`} />

            <div className="relative">
              <div className={`size-10 rounded-xl ${card.bg} flex items-center justify-center mb-4`}>
                <card.icon className={`size-5 ${card.color}`} />
              </div>
              {card.value === "live" ? (
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex size-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full size-2.5 bg-green-400" />
                  </span>
                  <span className="text-3xl font-black text-green-400">Live</span>
                </div>
              ) : (
                <p className={`text-4xl font-black ${card.color}`}>{card.value}</p>
              )}
              <p className="text-xs font-medium text-muted-foreground mt-1.5">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
            <h2 className="font-bold text-foreground">Recent Events</h2>
            <Link href="/dashboard/events" className="text-xs text-primary hover:underline font-medium">
              View all →
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-3">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-400/5 flex items-center justify-center">
                <Zap className="size-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No events yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                  Run the pipeline to start collecting events.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{event.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {event.ecosystem && <EcosystemBadge ecosystem={event.ecosystem} />}
                      {event.category && (
                        <span className="text-xs text-muted-foreground capitalize">{event.category}</span>
                      )}
                    </div>
                  </div>
                  {event.importance_score && (
                    <span className={`shrink-0 text-sm font-black px-2.5 py-1 rounded-lg ${getScoreColor(event.importance_score)}`}>
                      {event.importance_score}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
            <h2 className="font-bold text-foreground">Activity</h2>
            <Link href="/dashboard/activity" className="text-xs text-primary hover:underline font-medium">
              View all →
            </Link>
          </div>
          {stats.activities.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-3">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Activity className="size-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {stats.activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed line-clamp-2">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatTime(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick setup banner when no sources */}
      {stats.sourceCount === 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 flex items-center gap-4">
          <div className="size-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Radio className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Get started — add your first sources</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Add X accounts to track in the Sources page, or use the Admin panel to bulk-add accounts by category.
            </p>
          </div>
          <Link
            href="/admin/accounts"
            className="shrink-0 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Add Sources
          </Link>
        </div>
      )}
    </div>
  );
}

function EcosystemBadge({ ecosystem }: { ecosystem: string }) {
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full capitalize ${ECO_BADGE[ecosystem] ?? ECO_BADGE.other}`}>
      {ecosystem}
    </span>
  );
}

function getScoreColor(score: number) {
  if (score >= 8) return "bg-green-400/15 text-green-400";
  if (score >= 6) return "bg-amber-400/15 text-amber-400";
  return "bg-muted text-muted-foreground";
}

function parseUTC(iso: string): Date {
  const hasZone = iso.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(iso);
  return new Date(hasZone ? iso : iso + "Z");
}

function formatTime(isoString: string) {
  const date = parseUTC(isoString);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString([], { timeZone: "UTC" });
}
