import { supabase } from "@/lib/supabase";
import { Zap, Clock, ExternalLink } from "lucide-react";
import { EventsFilters } from "@/components/events/EventsFilters";
import type { Ecosystem, EventCategory, Event } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const ECOSYSTEM_COLORS: Record<string, string> = {
  ronin: "bg-blue-400/15 text-blue-400",
  immutable: "bg-cyan-400/15 text-cyan-400",
  abstract: "bg-violet-400/15 text-violet-400",
  other: "bg-muted text-muted-foreground",
};

const CATEGORY_COLORS: Record<string, string> = {
  launch: "bg-green-400/15 text-green-400",
  partnership: "bg-blue-400/15 text-blue-400",
  funding: "bg-amber-400/15 text-amber-400",
  token: "bg-violet-400/15 text-violet-400",
  nft: "bg-pink-400/15 text-pink-400",
  tournament: "bg-orange-400/15 text-orange-400",
  staking: "bg-cyan-400/15 text-cyan-400",
  campaign: "bg-rose-400/15 text-rose-400",
  migration: "bg-yellow-400/15 text-yellow-400",
  gameplay: "bg-emerald-400/15 text-emerald-400",
  metrics: "bg-sky-400/15 text-sky-400",
  patch: "bg-indigo-400/15 text-indigo-400",
  leaderboard: "bg-fuchsia-400/15 text-fuchsia-400",
  other: "bg-muted text-muted-foreground",
};

function getScoreColor(score: number) {
  if (score >= 8) return "bg-green-400/15 text-green-400 border border-green-400/20";
  if (score >= 6) return "bg-amber-400/15 text-amber-400 border border-amber-400/20";
  if (score >= 4) return "bg-orange-400/15 text-orange-400 border border-orange-400/20";
  return "bg-muted text-muted-foreground border border-border";
}

function parseUTC(iso: string): Date {
  const hasZone = iso.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(iso);
  return new Date(hasZone ? iso : iso + "Z");
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - parseUTC(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

interface SourceTweet {
  tweet_id: string;
  username: string;
  url: string;
  content: string;
}

interface PageProps {
  searchParams: Promise<{ ecosystem?: string; category?: string; sort?: string }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const { ecosystem, category, sort } = await searchParams;
  const activeEco = ecosystem ?? "all";
  const activeCategory = category ?? "all";
  const activeSort = sort ?? "newest";

  const sortColumn = activeSort === "score" ? "importance_score" : "created_at";

  let query = supabase
    .from("events")
    .select("*")
    .order(sortColumn, { ascending: false })
    .limit(100);

  if (activeEco !== "all") query = query.eq("ecosystem", activeEco as Ecosystem);
  if (activeCategory !== "all") query = query.eq("category", activeCategory as EventCategory);

  const { data, error } = await query;
  const events: Event[] = data ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Events</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {events.length} detected event{events.length !== 1 ? "s" : ""} from tracked sources
        </p>
      </div>

      <EventsFilters />

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">
          Failed to load events: {error.message}
        </div>
      )}

      {events.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-24 flex flex-col items-center gap-3">
          <div className="size-14 rounded-full bg-muted flex items-center justify-center">
            <Zap className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No events found</p>
          <p className="text-xs text-muted-foreground max-w-xs text-center">
            Events are detected automatically when the pipeline processes tweets from your tracked sources.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event) => {
            const sourceTweets: SourceTweet[] = Array.isArray(event.source_tweets)
              ? (event.source_tweets as unknown as SourceTweet[])
              : [];

            return (
              <div key={event.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-border/60 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {event.ecosystem && (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${ECOSYSTEM_COLORS[event.ecosystem] ?? ECOSYSTEM_COLORS.other}`}>
                        {event.ecosystem}
                      </span>
                    )}
                    {event.category && (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.other}`}>
                        {event.category}
                      </span>
                    )}
                  </div>
                  {event.importance_score !== null && (
                    <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full tabular-nums ${getScoreColor(event.importance_score)}`}>
                      {event.importance_score}/10
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-foreground leading-snug line-clamp-2">
                    {event.title ?? "Untitled Event"}
                  </h3>
                  {event.summary && (
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">
                      {event.summary}
                    </p>
                  )}
                </div>

                {event.keywords && event.keywords.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {event.keywords.slice(0, 5).map((kw) => (
                      <span key={kw} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md font-mono">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                {sourceTweets.length > 0 && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Source{sourceTweets.length > 1 ? "s" : ""}
                    </p>
                    {sourceTweets.slice(0, 3).map((tw) => (
                      <a
                        key={tw.tweet_id}
                        href={tw.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 group"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-medium text-primary group-hover:underline">
                            @{tw.username}
                          </span>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mt-0.5">
                            {tw.content}
                          </p>
                        </div>
                        <ExternalLink className="size-3 shrink-0 text-muted-foreground group-hover:text-primary mt-0.5 transition-colors" />
                      </a>
                    ))}
                    {sourceTweets.length > 3 && (
                      <p className="text-[10px] text-muted-foreground">+{sourceTweets.length - 3} more tweets</p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1.5 mt-auto pt-1 text-[11px] text-muted-foreground">
                  <Clock className="size-3" />
                  {formatRelativeTime(event.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
