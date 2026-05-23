import { Bone } from "@/components/ui/bone";

export default function DashboardLoading() {
  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Ticker skeleton */}
      <div className="cos-ticker">
        <Bone className="h-5 w-12 rounded shrink-0" />
        <div className="flex gap-6 overflow-hidden flex-1">
          {[...Array(4)].map((_, i) => <Bone key={i} className="h-4 w-48 shrink-0" />)}
        </div>
      </div>

      <div className="cos-page space-y-6" style={{ paddingTop: 20 }}>
        {/* Headline */}
        <div className="space-y-3">
          <Bone className="h-3 w-24" />
          <Bone className="h-9 w-72" />
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => <Bone key={i} className="h-6 w-20 rounded-md" />)}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Bone className="h-3 w-20" />
                <Bone className="h-3 w-8" />
              </div>
              <Bone className="h-9 w-16" />
              <Bone className="h-8 w-full rounded" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Activity feed */}
          <div className="lg:col-span-1 bg-card border border-border rounded-xl overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <Bone className="h-4 w-24" />
            </div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-b border-border last:border-0 px-4 py-3 space-y-1.5">
                <div className="flex justify-between">
                  <Bone className="h-3 w-16" />
                  <Bone className="h-3 w-10" />
                </div>
                <Bone className="h-3 w-full" />
                <Bone className="h-3 w-3/4" />
              </div>
            ))}
          </div>

          {/* Recent events */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <Bone className="h-4 w-28" />
            </div>
            {[...Array(7)].map((_, i) => (
              <div key={i} className="border-b border-border last:border-0 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex gap-2">
                      <Bone className="h-4 w-14 rounded-full" />
                      <Bone className="h-4 w-14 rounded-full" />
                    </div>
                    <Bone className="h-4 w-full" />
                    <Bone className="h-3 w-5/6" />
                  </div>
                  <Bone className="h-8 w-8 rounded-lg shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
