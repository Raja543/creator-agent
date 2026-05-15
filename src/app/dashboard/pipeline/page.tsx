import { supabase } from "@/lib/supabase";
import { PipelineClient } from "@/components/pipeline/PipelineClient";
import type { PipelineStatus } from "@/lib/database.types";

const STAGES: { id: PipelineStatus; label: string; color: string }[] = [
  { id: "idea", label: "Ideas", color: "text-violet-400" },
  { id: "draft", label: "Drafting", color: "text-blue-400" },
  { id: "preparing", label: "Preparing", color: "text-amber-400" },
  { id: "review", label: "Review", color: "text-orange-400" },
  { id: "published", label: "Published", color: "text-green-400" },
];

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const { data: ideas } = await supabase
    .from("content_ideas")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  const grouped = Object.fromEntries(
    STAGES.map((s) => [s.id, (ideas ?? []).filter((i) => i.status === s.id)])
  ) as Record<PipelineStatus, typeof ideas>;

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground">
          <span className="bg-gradient-to-r from-cyan-400 to-cyan-400/60 bg-clip-text text-transparent">Pipeline</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drag cards between columns to update status
        </p>
      </div>
      <PipelineClient stages={STAGES} initialGrouped={grouped ?? {}} />
    </div>
  );
}
