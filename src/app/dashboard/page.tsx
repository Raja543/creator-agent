import { supabase } from "@/lib/supabase";
import { Zap, Radio, Lightbulb, Activity, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";

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
    .limit(5);
  return data ?? [];
}

async function getLatestSummary() {
  const { data } = await supabase
    .from("summaries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data;
}

export default async function DashboardPage() {
  const [stats, recentEvents, latestSummary] = await Promise.all([
    getStats(),
    getRecentEvents(),
    getLatestSummary(),
  ]);

  const statCards = [
    {
      label: "Active Sources",
      value: stats.sourceCount,
      icon: Radio,
      href: "/dashboard/sources",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Events Today",
      value: stats.eventCount,
      icon: Zap,
      href: "/dashboard/events",
      color: "text-violet-400",
      bg: "bg-violet-400/10",
    },
    {
      label: "Content Ideas",
      value: stats.ideaCount,
      icon: Lightbulb,
      href: "/dashboard/ideas",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      label: "System Active",
      value: "Live",
      icon: Activity,
      href: "/dashboard/activity",
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Web3 gaming intelligence dashboard
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-card border border-border rounded-xl p-4 hover:border-border/80 hover:bg-card/80 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`size-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`size-4 ${card.color}`} />
              </div>
              <TrendingUp className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Events</h2>
            <Link href="/dashboard/events" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <div className="text-center py-10">
              <Zap className="size-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No events detected yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Events will appear here once the collection pipeline runs
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="size-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.summary}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {event.ecosystem && (
                        <EcosystemBadge ecosystem={event.ecosystem} />
                      )}
                      {event.category && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full capitalize">
                          {event.category}
                        </span>
                      )}
                    </div>
                  </div>
                  {event.importance_score && (
                    <div className="shrink-0">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${getScoreColor(event.importance_score)}`}>
                        {event.importance_score}/10
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Activity</h2>
            <Link href="/dashboard/activity" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          {stats.activities.length === 0 ? (
            <div className="text-center py-10">
              <Activity className="size-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2.5">
                  <div className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{activity.message}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="size-3 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">
                        {formatTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Latest Summary */}
      {latestSummary && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Latest Intelligence Report</h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {formatTime(latestSummary.created_at)}
            </div>
          </div>
          <div className="space-y-4">
            {latestSummary.content.split(/\n\n(?=[A-Z]+\n)/).map((section: string) => {
              const lines = section.trim().split("\n");
              const heading = lines[0];
              const body = lines.slice(1).join("\n");
              const headingColors: Record<string, string> = {
                RONIN: "text-blue-400",
                IMMUTABLE: "text-cyan-400",
                ABSTRACT: "text-violet-400",
                OVERALL: "text-amber-400",
              };
              return (
                <div key={heading}>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${headingColors[heading] ?? "text-muted-foreground"}`}>
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
      )}

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
  const colors: Record<string, string> = {
    ronin: "bg-blue-400/15 text-blue-400",
    immutable: "bg-cyan-400/15 text-cyan-400",
    abstract: "bg-violet-400/15 text-violet-400",
    other: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${colors[ecosystem] ?? colors.other}`}>
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
