import { supabase } from "@/lib/supabase";
import { generateEcosystemSummary } from "@/lib/gemini";
import { isCronAuthorized } from "@/lib/cron-auth";

export function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return POST();
}

export async function POST() {
  // Try last 24 hours first, fall back to last 50 events if window is dry
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let { data: events } = await supabase
    .from("events")
    .select("title, summary, ecosystem, category, importance_score, keywords")
    .gte("created_at", since24h)
    .gte("importance_score", 5)
    .order("importance_score", { ascending: false })
    .limit(50);

  // If nothing in last 24h, grab the most recent 50 events regardless of age
  if (!events?.length) {
    const { data: fallback } = await supabase
      .from("events")
      .select("title, summary, ecosystem, category, importance_score, keywords")
      .gte("importance_score", 5)
      .order("created_at", { ascending: false })
      .limit(50);
    events = fallback;
  }

  if (!events?.length) {
    return Response.json({ message: "No events found to summarize" });
  }

  const summary = await generateEcosystemSummary(events);
  if (!summary) {
    return Response.json({ error: "Failed to generate summary" }, { status: 500 });
  }

  const content = [
    "RONIN\n" + summary.ronin,
    "IMMUTABLE\n" + summary.immutable,
    "ABSTRACT\n" + summary.abstract,
    "OVERALL\n" + summary.overall,
  ].join("\n\n");

  const { data: saved } = await supabase
    .from("summaries")
    .insert({
      timeframe: "4h",
      ecosystems: ["ronin", "immutable", "abstract"],
      content,
    })
    .select()
    .single();

  await supabase.from("activities").insert({
    type: "summary_generated",
    message: `Intelligence report generated covering ${events.length} events across all ecosystems`,
    metadata: { summary_id: saved?.id, event_count: events.length },
  });

  return Response.json({ summary: content, event_count: events.length });
}
