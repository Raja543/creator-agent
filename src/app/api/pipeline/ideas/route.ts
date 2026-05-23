import { supabase } from "@/lib/supabase";
import { generateContentIdeas } from "@/lib/gemini";
import { guardCron } from "@/lib/cron-auth";
import { fetchTopEvents, logActivity } from "@/lib/queries";

export function GET(request: Request) { return guardCron(request, POST); }

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(w => w.length > 2);
}

function titleSimilarity(a: string, b: string): number {
  const wa = new Set(tokenize(a));
  const wb = tokenize(b);
  if (!wa.size || !wb.length) return 0;
  const overlap = wb.filter(w => wa.has(w)).length;
  return overlap / Math.max(wa.size, wb.length);
}

export async function POST() {
  const events = await fetchTopEvents();

  if (!events.length) {
    return Response.json({ message: "No events found to generate ideas from" });
  }

  // Fetch existing ideas from last 48h to avoid duplicates
  const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: existingIdeas } = await supabase
    .from("content_ideas")
    .select("title")
    .gte("created_at", since48h);

  const existingTitles = existingIdeas?.map((i) => i.title as string).filter(Boolean) ?? [];

  const result = await generateContentIdeas(events, existingTitles);
  if (!result?.ideas?.length) {
    return Response.json({ error: "Failed to generate ideas" }, { status: 500 });
  }

  const created = [];
  let skipped = 0;
  for (const idea of result.ideas) {
    // Skip if too similar to an already-existing idea
    const isDuplicate = existingTitles.some(
      (existing) => titleSimilarity(idea.title, existing) >= 0.5,
    );
    if (isDuplicate) {
      skipped++;
      continue;
    }

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

    if (data) {
      created.push(data);
      existingTitles.push(idea.title); // prevent duplicates within same batch
    }
  }

  await logActivity("idea_generated",
    `Generated ${created.length} content ideas from ${events.length} ecosystem events (${skipped} duplicates skipped)`,
    { ideas_created: created.length, skipped, event_count: events.length },
  );

  return Response.json({ ideas_created: created.length, skipped, ideas: created });
}
