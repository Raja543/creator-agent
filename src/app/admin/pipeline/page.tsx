import { PipelineControl } from "@/components/admin/PipelineControl";
import { supabase } from "@/lib/supabase";

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
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Intelligence Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Run each step manually or trigger the full pipeline at once
        </p>
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
