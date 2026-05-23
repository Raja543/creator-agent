import { Bone } from "@/components/ui/bone";

export default function SummariesLoading() {
  return (
    <div className="cos-page space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <Bone className="h-3 w-40" />
        <Bone className="h-8 w-28" />
        <Bone className="h-4 w-64" />
      </div>

      {/* Report cards */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Bone className="size-8 rounded-lg" />
                <div className="space-y-1.5">
                  <Bone className="h-4 w-36" />
                  <Bone className="h-3 w-20" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Bone className="h-5 w-12 rounded-full" />
                <Bone className="size-5 rounded" />
              </div>
            </div>
            {i === 0 && (
              <div className="border-t border-border px-5 py-4 space-y-4">
                {["RONIN", "IMMUTABLE", "ABSTRACT", "OVERALL"].map((section) => (
                  <div key={section} className="space-y-2">
                    <Bone className="h-3 w-20" />
                    <Bone className="h-3 w-full" />
                    <Bone className="h-3 w-5/6" />
                    <Bone className="h-3 w-4/5" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
