import { supabase } from "@/lib/supabase";
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

  const sortColumn = activeSort === "score" ? "importance_score" : "created_at";

  let query = supabase
    .from("events")
    .select("*")
    .order(sortColumn, { ascending: false })
    .limit(100);

  if (activeEco !== "all") query = query.eq("ecosystem", activeEco as Ecosystem);
  if (activeCategory !== "all") query = query.eq("category", activeCategory as EventCategory);
  if (activeMinScore !== null) query = query.gte("importance_score", activeMinScore);
  if (searchQuery) query = query.or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%`);

  const { data, error } = await query;
  const events: Event[] = data ?? [];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">
          <span className="bg-gradient-to-r from-amber-400 to-amber-400/60 bg-clip-text text-transparent">Events</span>
        </h1>
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

      <EventsClient key={`${activeEco}-${activeCategory}-${activeSort}-${activeMinScore}-${searchQuery}`} initialEvents={events} />
    </div>
  );
}
