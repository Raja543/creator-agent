import { Bone } from "@/components/ui/bone";

export default function PipelineLoading() {
  return (
    <div className="cos-page space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <Bone className="h-3 w-28" />
        <Bone className="h-8 w-32" />
        <Bone className="h-4 w-56 hidden md:block" />
      </div>

      {/* Mobile: tab pills */}
      <div className="flex gap-2 md:hidden">
        {[...Array(5)].map((_, i) => <Bone key={i} className="h-8 w-20 rounded-lg" />)}
      </div>

      {/* Desktop: kanban columns */}
      <div className="hidden md:grid grid-cols-5 gap-3" style={{ minHeight: 500 }}>
        {[...Array(5)].map((_, col) => (
          <div key={col} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="border-b border-border px-3 py-2.5 flex items-center justify-between">
              <Bone className="h-4 w-16" />
              <Bone className="h-4 w-6 rounded-full" />
            </div>
            <div className="p-2 space-y-2">
              {[...Array(col === 0 ? 4 : col === 1 ? 2 : 1)].map((_, i) => (
                <div key={i} className="bg-background border border-border rounded-lg p-3 space-y-2">
                  <div className="flex gap-1.5">
                    <Bone className="h-4 w-14 rounded-full" />
                    <Bone className="h-4 w-12 rounded-full" />
                  </div>
                  <Bone className="h-4 w-full" />
                  <Bone className="h-3 w-4/5" />
                  <Bone className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
