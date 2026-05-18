import { Bone } from "@/components/ui/bone";

export default function IdeasLoading() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="space-y-2 mb-6">
        <Bone className="h-8 w-24 rounded-lg" />
        <Bone className="h-4 w-44" />
      </div>

      {/* Header controls skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bone className="h-6 w-16 rounded-full" />
          <Bone className="h-9 w-48 rounded-lg" />
        </div>
        <Bone className="h-9 w-24 rounded-lg" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                <Bone className="h-5 w-16 rounded-full" />
                <Bone className="h-5 w-12 rounded-full" />
              </div>
              <div className="flex gap-1">
                <Bone className="h-7 w-7 rounded-lg" />
                <Bone className="h-7 w-7 rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Bone className="h-5 w-full" />
              <Bone className="h-4 w-5/6" />
              <Bone className="h-4 w-3/4" />
            </div>
            <Bone className="h-10 w-full rounded-lg" />
            <div className="pt-2 border-t border-border/50 flex justify-between">
              <Bone className="h-4 w-20" />
              <Bone className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
