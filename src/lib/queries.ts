import { supabase } from "@/lib/supabase";
import type { ActivityType } from "@/lib/database.types";

const EVENT_SELECT = "title, summary, ecosystem, category, importance_score, keywords" as const;

export async function logActivity(
  type: ActivityType,
  message: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await supabase.from("activities").insert({ type, message, metadata: metadata ?? null });
}

/** Returns top events from the last 24 h (importance ≥ 5), falling back to
 *  the most recent 50 events of any age if the recent window is empty. */
export async function fetchTopEvents() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let { data: events } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .gte("created_at", since24h)
    .gte("importance_score", 5)
    .order("importance_score", { ascending: false })
    .limit(50);

  if (!events?.length) {
    const { data: fallback } = await supabase
      .from("events")
      .select(EVENT_SELECT)
      .gte("importance_score", 5)
      .order("created_at", { ascending: false })
      .limit(50);
    events = fallback;
  }

  return events ?? [];
}
