import { createClient } from "@/lib/supabase-server";
import { getRequestUserId } from "@/lib/auth-headers";
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
  const [userId, supabase] = await Promise.all([getRequestUserId(), createClient()]);

  const { data: ideas } = await supabase
    .from("content_ideas")
    .select("*")
    .eq("user_id", userId!)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  const grouped = Object.fromEntries(
    STAGES.map((s) => [s.id, (ideas ?? []).filter((i) => i.status === s.id)])
  ) as Record<PipelineStatus, typeof ideas>;

  return (
    <div className="cos-page space-y-4">
      <div className="cos-page-head">
        <div className="cos-eyebrow">Content · Kanban</div>
        <h1 className="cos-page-title">Workflow</h1>
        <p className="cos-page-sub hidden md:block">Drag cards between columns to update status.</p>
        <p className="cos-page-sub md:hidden">Tap a stage to view and move cards.</p>
      </div>
      <PipelineClient stages={STAGES} initialGrouped={grouped ?? {}} />
    </div>
  );
}
