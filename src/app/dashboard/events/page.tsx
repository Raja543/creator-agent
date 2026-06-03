import { createClient } from "@/lib/supabase-server";
import { getRequestUserId } from "@/lib/auth-headers";
import { EventsFilters } from "@/components/events/EventsFilters";
import { EventsClient } from "@/components/events/EventsClient";
import type { Ecosystem, EventCategory, Event } from "@/lib/database.types";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ ecosystem?: string; category?: string; sort?: string; minScore?: string; q?: string }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const { ecosystem, category, sort, minScore, q } = await searchParams;
  const activeEco = ecosystem ?? "all";
  const activeCategory = category ?? "all";
  const activeSort = sort ?? "newest";
  const activeMinScore = minScore ? parseInt(minScore) : null;
  const searchQuery = q?.trim() ?? "";

  const [userId, supabase] = await Promise.all([getRequestUserId(), createClient()]);

  const sortColumn = activeSort === "score" ? "importance_score" : "created_at";

  // All distinct ecosystems/categories in this user's events → dynamic filters
  const { data: facetRows } = await supabase
    .from("events")
    .select("ecosystem, category")
    .eq("user_id", userId!);
  const ecosystems = [
    ...new Set((facetRows ?? []).map((r) => r.ecosystem).filter(Boolean) as string[]),
  ].sort();
  const categories = [
    ...new Set((facetRows ?? []).map((r) => r.category).filter(Boolean) as string[]),
  ].sort();

  let query = supabase
    .from("events")
    .select("*")
    .eq("user_id", userId!)
    .order(sortColumn, { ascending: false })
    .limit(100);

  if (activeEco !== "all") query = query.eq("ecosystem", activeEco as Ecosystem);
  if (activeCategory !== "all") query = query.eq("category", activeCategory as EventCategory);
  if (activeMinScore !== null) query = query.gte("importance_score", activeMinScore);
  if (searchQuery) query = query.or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%`);

  const { data, error } = await query;
  const events: Event[] = data ?? [];

  return (
    <div className="cos-page space-y-4">
      <div className="cos-page-head">
        <div className="cos-eyebrow">SIGNAL · {events.length} EVENTS</div>
        <h1 className="cos-page-title">Events</h1>
        <p className="cos-page-sub">Detected from tracked sources. Scored on engagement potential.</p>
      </div>
      <EventsFilters ecosystems={ecosystems} categories={categories} />
      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "var(--rose-dim)", color: "var(--rose)", border: "1px solid rgba(244,63,94,.2)" }}>
          Failed to load events: {error.message}
        </div>
      )}
      <EventsClient key={`${activeEco}-${activeCategory}-${activeSort}-${activeMinScore}-${searchQuery}`} initialEvents={events} />
    </div>
  );
}
