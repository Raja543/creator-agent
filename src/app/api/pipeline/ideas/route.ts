import { supabase } from "@/lib/supabase";
import { generateContentIdeas } from "@/lib/gemini";
import { guardCron } from "@/lib/cron-auth";
import { fetchTopEvents, logActivity } from "@/lib/queries";

export function GET(request: Request) { return guardCron(request, POST); }

export async function POST() {
  const events = await fetchTopEvents();

  if (!events.length) {
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

  await logActivity("idea_generated",
    `Generated ${created.length} content ideas from ${events.length} ecosystem events`,
    { ideas_created: created.length, event_count: events.length },
  );

  return Response.json({ ideas_created: created.length, ideas: created });
}
