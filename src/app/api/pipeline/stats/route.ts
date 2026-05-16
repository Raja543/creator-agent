import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const [tweets, unprocessed, events, ideas, lastSummary] = await Promise.all([
    supabase.from("tweets").select("id", { count: "exact", head: true }),
    supabase.from("tweets").select("id", { count: "exact", head: true }).eq("processed", false),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("content_ideas").select("id", { count: "exact", head: true }),
    supabase.from("summaries").select("created_at").order("created_at", { ascending: false }).limit(1).single(),
  ]);

  return Response.json({
    totalTweets: tweets.count ?? 0,
    unprocessedTweets: unprocessed.count ?? 0,
    totalEvents: events.count ?? 0,
    totalIdeas: ideas.count ?? 0,
    lastSummaryAt: lastSummary.data?.created_at ?? null,
  });
}
