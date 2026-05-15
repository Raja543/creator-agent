import { supabase } from "@/lib/supabase";
import { SummariesClient } from "@/components/summaries/SummariesClient";

export const dynamic = "force-dynamic";

export default async function SummariesPage() {
  const { data: summaries } = await supabase
    .from("summaries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Intel Reports</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {summaries?.length ?? 0} report{summaries?.length !== 1 ? "s" : ""} generated — updated every 4 hours
        </p>
      </div>

      <SummariesClient summaries={summaries ?? []} />
    </div>
  );
}
