import { Bone } from "@/components/ui/bone";

export default function SourcesLoading() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bone className="h-8 w-24 rounded-lg" />
          <Bone className="h-6 w-8 rounded-full" />
          <Bone className="h-9 w-52 rounded-lg" />
        </div>
        <Bone className="h-9 w-28 rounded-lg" />
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <Bone className="size-8 rounded-full" />
                <div className="space-y-1.5">
                  <Bone className="h-4 w-28" />
                  <Bone className="h-3 w-20" />
                </div>
              </div>
              <div className="flex gap-1">
                <Bone className="h-8 w-8 rounded-lg" />
                <Bone className="h-8 w-8 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-2">
              <Bone className="h-5 w-16 rounded-full" />
              <Bone className="h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex gap-4">
          {["Username", "Ecosystem", "Category", "Priority", "Status", "Actions"].map((h) => (
            <Bone key={h} className="h-4 w-20" />
          ))}
        </div>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="border-b border-border last:border-0 px-4 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2.5 flex-1">
              <Bone className="size-7 rounded-full" />
              <div className="space-y-1">
                <Bone className="h-4 w-24" />
                <Bone className="h-3 w-16" />
              </div>
            </div>
            <Bone className="h-5 w-16 rounded-full" />
            <Bone className="h-5 w-20 rounded-full" />
            <Bone className="h-3 w-16 rounded-full" />
            <Bone className="h-5 w-9 rounded-full" />
            <div className="flex gap-1 ml-auto">
              <Bone className="h-6 w-6 rounded-md" />
              <Bone className="h-6 w-6 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
