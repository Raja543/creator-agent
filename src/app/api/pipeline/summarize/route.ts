import { supabaseService } from "@/lib/supabase-service";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateEcosystemSummary } from "@/lib/gemini";
import { guardCron } from "@/lib/cron-auth";
import { fetchTopEvents, logActivity } from "@/lib/queries";

export function GET(request: Request) { return guardCron(request, runForAllUsers); }

async function runSummarize(userId: string) {
  const events = await fetchTopEvents(userId);
  if (!events.length) return { message: "No events found to summarize" };

  const summary = await generateEcosystemSummary(events);
  if (!summary) return { error: "Failed to generate summary" };

  const content = [
    "RONIN\n" + summary.ronin,
    "IMMUTABLE\n" + summary.immutable,
    "ABSTRACT\n" + summary.abstract,
    "OVERALL\n" + summary.overall,
  ].join("\n\n");

  const { data: saved } = await supabaseService.from("summaries").insert({
    user_id: userId, timeframe: "4h", ecosystems: ["ronin", "immutable", "abstract"], content,
  }).select().single();

  await logActivity(userId, "summary_generated",
    `Intelligence report generated covering ${events.length} events`,
    { summary_id: saved?.id, event_count: events.length },
  );
  return { summary: content, event_count: events.length };
}

async function runForAllUsers() {
  const { data: rows } = await supabaseService
    .from("events").select("user_id").not("user_id", "is", null);
  const userIds = [...new Set(rows?.map(r => r.user_id).filter(Boolean) as string[])];
  const results = [];
  for (const userId of userIds) results.push(await runSummarize(userId));
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
  return Response.json(await runSummarize(user.id));
}
