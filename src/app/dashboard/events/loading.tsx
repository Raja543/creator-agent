import { Bone } from "@/components/ui/bone";

export default function EventsLoading() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="space-y-2">
        <Bone className="h-8 w-28 rounded-lg" />
        <Bone className="h-4 w-52" />
      </div>

      {/* Filter bar skeleton */}
      <div className="space-y-3 pb-3 border-b border-border">
        <Bone className="h-9 w-full rounded-lg" />
        <div className="flex gap-2 flex-wrap">
          {[...Array(5)].map((_, i) => <Bone key={i} className="h-7 w-20 rounded-full" />)}
        </div>
        <div className="flex gap-2 flex-wrap">
          {[...Array(8)].map((_, i) => <Bone key={i} className="h-6 w-16 rounded-full" />)}
        </div>
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                <Bone className="h-5 w-16 rounded-full" />
                <Bone className="h-5 w-16 rounded-full" />
              </div>
              <Bone className="h-7 w-9 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Bone className="h-5 w-full" />
              <Bone className="h-4 w-5/6" />
              <Bone className="h-4 w-4/6" />
            </div>
            <div className="flex gap-1.5">
              <Bone className="h-5 w-14 rounded-md" />
              <Bone className="h-5 w-16 rounded-md" />
            </div>
            <div className="pt-2 border-t border-border/50">
              <Bone className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
