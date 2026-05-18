import { supabase } from "@/lib/supabase";
import { generateEcosystemSummary } from "@/lib/gemini";
import { guardCron } from "@/lib/cron-auth";
import { fetchTopEvents, logActivity } from "@/lib/queries";

export function GET(request: Request) { return guardCron(request, POST); }

export async function POST() {
  const events = await fetchTopEvents();

  if (!events.length) {
    return Response.json({ message: "No events found to summarize" });
  }

  const summary = await generateEcosystemSummary(events);
  if (!summary) {
    return Response.json({ error: "Failed to generate summary" }, { status: 500 });
  }

  const content = [
    "RONIN\n" + summary.ronin,
    "IMMUTABLE\n" + summary.immutable,
    "ABSTRACT\n" + summary.abstract,
    "OVERALL\n" + summary.overall,
  ].join("\n\n");

  const { data: saved } = await supabase
    .from("summaries")
    .insert({
      timeframe: "4h",
      ecosystems: ["ronin", "immutable", "abstract"],
      content,
    })
    .select()
    .single();

  await logActivity("summary_generated",
    `Intelligence report generated covering ${events.length} events across all ecosystems`,
    { summary_id: saved?.id, event_count: events.length },
  );

  return Response.json({ summary: content, event_count: events.length });
}
