import { supabase } from "@/lib/supabase";
import { generateContentIdeas } from "@/lib/gemini";
import { isCronAuthorized } from "@/lib/cron-auth";

export function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return POST();
}

export async function POST() {
  // Use top events from last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let { data: events } = await supabase
    .from("events")
    .select("title, summary, ecosystem, category, importance_score, keywords")
    .gte("created_at", since)
    .gte("importance_score", 5)
    .order("importance_score", { ascending: false })
    .limit(50);

  // Fallback: use most recent 50 events regardless of age
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
    return Response.json({ message: "No events found to generate ideas from" });
  }

  const result = await generateContentIdeas(events);
  if (!result?.ideas?.length) {
    return Response.json({ error: "Failed to generate ideas" }, { status: 500 });
  }

  const created = [];
  for (const idea of result.ideas) {
    const { data } = await supabase
      .from("content_ideas")
      .insert({
        title: idea.title,
        description: idea.description,
        format: idea.format as string,
        angle: idea.angle,
        potential: idea.potential as string,
        source_events: events.slice(0, 3).map((e) => ({ title: e.title, ecosystem: e.ecosystem })),
        status: "idea",
        priority: idea.potential === "high" ? 8 : idea.potential === "medium" ? 5 : 3,
      })
      .select()
      .single();

    if (data) created.push(data);
  }

  await supabase.from("activities").insert({
    type: "idea_generated",
    message: `Generated ${created.length} content ideas from ${events.length} ecosystem events`,
    metadata: { ideas_created: created.length, event_count: events.length },
  });

  return Response.json({ ideas_created: created.length, ideas: created });
}
