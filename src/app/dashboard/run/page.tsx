import { createClient } from "@/lib/supabase-server";
import { getRequestUserId } from "@/lib/auth-headers";
import { PipelineControl } from "@/components/admin/PipelineControl";

export const dynamic = "force-dynamic";

export default async function RunPage() {
  const [userId, supabase] = await Promise.all([getRequestUserId(), createClient()]);

  const [tweets, events, ideas, lastSummary, unprocessed] = await Promise.all([
    supabase.from("tweets").select("id", { count: "exact" }).eq("user_id", userId!),
    supabase.from("events").select("id", { count: "exact" }).eq("user_id", userId!),
    supabase.from("content_ideas").select("id", { count: "exact" }).eq("user_id", userId!),
    supabase.from("summaries").select("created_at").eq("user_id", userId!).order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("tweets").select("id", { count: "exact" }).eq("user_id", userId!).eq("processed", false),
  ]);

  return (
    <div className="cos-page space-y-4">
      <div className="cos-page-head">
        <div className="cos-eyebrow">INTELLIGENCE · MANUAL TRIGGER</div>
        <h1 className="cos-page-title">Run Pipeline</h1>
        <p className="cos-page-sub">Collect tweets, detect events, generate ideas and summaries. Run end-to-end or step by step.</p>
      </div>
      <PipelineControl
        stats={{
          totalTweets: tweets.count ?? 0,
          unprocessedTweets: unprocessed.count ?? 0,
          totalEvents: events.count ?? 0,
          totalIdeas: ideas.count ?? 0,
          lastSummaryAt: lastSummary.data?.created_at ?? null,
        }}
      />
    </div>
  );
}
