import { Bone } from "@/components/ui/bone";

export default function AdminLoading() {
  return (
    <div className="cos-page space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <Bone className="h-3 w-16" />
        <Bone className="h-8 w-36" />
        <Bone className="h-4 w-80" />
      </div>

      {/* KPI cards */}
      <div className="cos-kpi-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-4">
            <Bone className="h-3 w-28" />
            <Bone className="h-11 w-16" />
            <Bone className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Ecosystem distribution */}
      <Bone className="h-px w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
            <Bone className="h-3 w-20" />
            <Bone className="h-8 w-28" />
            <Bone className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <Bone className="h-px w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <Bone className="size-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-32" />
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-20" />
            </div>
            <Bone className="size-4 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
