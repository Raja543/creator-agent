import { supabaseService } from "@/lib/supabase-service";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateContentIdeas } from "@/lib/gemini";
import { guardCron } from "@/lib/cron-auth";
import { fetchTopEvents, logActivity } from "@/lib/queries";

export function GET(request: Request) { return guardCron(request, runForAllUsers); }

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(w => w.length > 2);
}
function titleSimilarity(a: string, b: string): number {
  const wa = new Set(tokenize(a));
  const wb = tokenize(b);
  if (!wa.size || !wb.length) return 0;
  return wb.filter(w => wa.has(w)).length / Math.max(wa.size, wb.length);
}

async function runIdeas(userId: string) {
  const events = await fetchTopEvents(userId);
  if (!events.length) return { message: "No events found to generate ideas from" };

  const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: existingIdeas } = await supabaseService
    .from("content_ideas").select("title").eq("user_id", userId).gte("created_at", since48h);
  const existingTitles = existingIdeas?.map(i => i.title as string).filter(Boolean) ?? [];

  const result = await generateContentIdeas(events, existingTitles);
  if (!result?.ideas?.length) return { error: "Failed to generate ideas" };

  const created = [];
  let skipped = 0;
  for (const idea of result.ideas) {
    if (existingTitles.some(t => titleSimilarity(idea.title, t) >= 0.5)) { skipped++; continue; }
    const { data } = await supabaseService.from("content_ideas").insert({
      user_id: userId,
      title: idea.title,
      description: idea.description,
      format: idea.format as string,
      angle: idea.angle,
      potential: idea.potential as string,
      source_events: events.slice(0, 3).map(e => ({ title: e.title, ecosystem: e.ecosystem })),
      status: "idea",
      priority: idea.potential === "high" ? 8 : idea.potential === "medium" ? 5 : 3,
    }).select().single();
    if (data) { created.push(data); existingTitles.push(idea.title); }
  }

  await logActivity(userId, "idea_generated",
    `Generated ${created.length} content ideas from ${events.length} events (${skipped} duplicates skipped)`,
    { ideas_created: created.length, skipped, event_count: events.length },
  );
  return { ideas_created: created.length, skipped, ideas: created };
}

async function runForAllUsers() {
  const { data: rows } = await supabaseService
    .from("events").select("user_id").not("user_id", "is", null);
  const userIds = [...new Set(rows?.map(r => r.user_id).filter(Boolean) as string[])];
  const results = [];
  for (const userId of userIds) results.push(await runIdeas(userId));
  return Response.json({ users_processed: userIds.length, results });
}

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await runIdeas(user.id));
}
