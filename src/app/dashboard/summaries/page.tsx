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
    <div className="cos-page space-y-4">
      <div className="cos-page-head">
        <div className="cos-eyebrow">INTEL · AUTO-GENERATED · 4H CYCLE</div>
        <h1 className="cos-page-title">Reports</h1>
        <p className="cos-page-sub">
          {summaries?.length ?? 0} report{summaries?.length !== 1 ? "s" : ""} generated synthesized ecosystem briefings from collection windows.
        </p>
      </div>

      <SummariesClient summaries={summaries ?? []} />
    </div>
  );
}
