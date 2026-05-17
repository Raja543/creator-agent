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
    <div className="cos-page space-y-4">
      <div className="cos-page-head">
        <div className="cos-eyebrow">GENERATED · {ideas.length} TOTAL</div>
        <h1 className="cos-page-title">Ideas</h1>
        <p className="cos-page-sub">AI-generated content opportunities, ranked by potential.</p>
      </div>

      <IdeasFilters />

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "var(--rose-dim)", color: "var(--rose)", border: "1px solid rgba(244,63,94,.2)" }}>
          Failed to load ideas: {error.message}
        </div>
      )}

      <IdeasClient key={`${activeFormat}-${activePotential}-${activeSort}`} initialIdeas={ideas} />
    </div>
  );
}
