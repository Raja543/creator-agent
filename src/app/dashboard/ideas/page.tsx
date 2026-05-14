import { supabase } from "@/lib/supabase";
import { IdeasClient } from "@/components/ideas/IdeasClient";
import { IdeasFilters } from "@/components/ideas/IdeasFilters";
import type { ContentFormat, ContentPotential } from "@/lib/database.types";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ format?: string; potential?: string; sort?: string }>;
}

export default async function IdeasPage({ searchParams }: PageProps) {
  const { format, potential, sort } = await searchParams;
  const activeFormat = format ?? "all";
  const activePotential = potential ?? "all";
  const activeSort = sort ?? "priority";

  const sortColumn = activeSort === "priority" ? "priority" : "created_at";

  let query = supabase
    .from("content_ideas")
    .select("*")
    .order(sortColumn, { ascending: false })
    .limit(100);

  if (activeFormat !== "all") query = query.eq("format", activeFormat as ContentFormat);
  if (activePotential !== "all") query = query.eq("potential", activePotential as ContentPotential);

  const { data, error } = await query;
  const ideas = data ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Content Ideas</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-generated content opportunities from detected events</p>
      </div>

      <IdeasFilters />

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">
          Failed to load ideas: {error.message}
        </div>
      )}

      <IdeasClient key={`${activeFormat}-${activePotential}-${activeSort}`} initialIdeas={ideas} />
    </div>
  );
}
