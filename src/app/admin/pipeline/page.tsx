import { PipelineControl } from "@/components/admin/PipelineControl";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminPipelinePage() {
  const [tweets, events, ideas, lastSummary] = await Promise.all([
    supabase.from("tweets").select("id", { count: "exact" }),
    supabase.from("events").select("id", { count: "exact" }),
    supabase.from("content_ideas").select("id", { count: "exact" }),
    supabase.from("summaries").select("created_at").order("created_at", { ascending: false }).limit(1).single(),
  ]);

  const unprocessed = await supabase
    .from("tweets")
    .select("id", { count: "exact" })
    .eq("processed", false);

  return (
    <div className="cos-page space-y-4">
      <div className="cos-page-head">
        <div className="cos-eyebrow">OPERATIONS · MANUAL TRIGGER</div>
        <h1 className="cos-page-title">Run the intelligence pipeline</h1>
        <p className="cos-page-sub">Run end-to-end or step by step. Each step can be triggered individually.</p>
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
