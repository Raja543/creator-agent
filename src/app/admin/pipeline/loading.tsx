import { Bone } from "@/components/ui/bone";

export default function AdminPipelineLoading() {
  return (
    <div className="cos-page space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <Bone className="h-3 w-40" />
        <Bone className="h-8 w-72" />
        <Bone className="h-4 w-80" />
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <Bone className="h-3 w-20" />
            <Bone className="h-7 w-12" />
          </div>
        ))}
      </div>

      {/* Pipeline steps */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 flex items-center gap-5">
            <Bone className="size-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-36" />
              <Bone className="h-3 w-full max-w-md" />
              <Bone className="h-3 w-24" />
            </div>
            <Bone className="h-9 w-24 rounded-lg shrink-0" />
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <Bone className="h-4 w-28" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1">
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}
