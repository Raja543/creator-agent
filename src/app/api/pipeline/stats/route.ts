import { getAuthContext } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { user, supabase } = ctx;
  const uid = user.id;

  const [tweets, unprocessed, events, ideas, lastSummary] = await Promise.all([
    supabase.from("tweets").select("id", { count: "exact", head: true }).eq("user_id", uid),
    supabase.from("tweets").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("processed", false),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("user_id", uid),
    supabase.from("content_ideas").select("id", { count: "exact", head: true }).eq("user_id", uid),
    supabase.from("summaries").select("created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).single(),
  ]);

  return Response.json({
    totalTweets: tweets.count ?? 0,
    unprocessedTweets: unprocessed.count ?? 0,
    totalEvents: events.count ?? 0,
    totalIdeas: ideas.count ?? 0,
    lastSummaryAt: lastSummary.data?.created_at ?? null,
  });
}
