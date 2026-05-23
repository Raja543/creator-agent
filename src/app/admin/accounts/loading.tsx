import { Bone } from "@/components/ui/bone";

export default function AccountsLoading() {
  return (
    <div className="cos-page space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <Bone className="h-3 w-24" />
        <Bone className="h-8 w-48" />
        <Bone className="h-4 w-96" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Bone className="h-9 w-52 rounded-lg" />
        <Bone className="h-9 w-32 rounded-lg" />
        <Bone className="h-9 w-32 rounded-lg" />
        <Bone className="h-9 w-32 rounded-lg" />
        <div className="ml-auto flex gap-2">
          <Bone className="h-9 w-32 rounded-lg" />
          <Bone className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bone className="size-9 rounded-full" />
                <div className="space-y-1.5">
                  <Bone className="h-4 w-28" />
                  <Bone className="h-3 w-20" />
                </div>
              </div>
              <div className="flex gap-1.5">
                <Bone className="h-7 w-7 rounded-md" />
                <Bone className="h-7 w-7 rounded-md" />
              </div>
            </div>
            <div className="flex gap-2">
              <Bone className="h-5 w-16 rounded-full" />
              <Bone className="h-5 w-20 rounded-full" />
            </div>
            <Bone className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <div className="border-b border-border px-4 py-3 grid grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => <Bone key={i} className="h-3 w-20" />)}
        </div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="border-b border-border last:border-0 px-4 py-3 grid grid-cols-7 gap-3 items-center">
            <div className="flex items-center gap-2.5">
              <Bone className="size-8 rounded-full" />
              <div className="space-y-1">
                <Bone className="h-4 w-24" />
                <Bone className="h-3 w-16" />
              </div>
            </div>
            <Bone className="h-5 w-16 rounded-full" />
            <Bone className="h-5 w-20 rounded-full" />
            <Bone className="h-2 w-full rounded-full" />
            <Bone className="h-5 w-10 rounded-full" />
            <Bone className="h-5 w-9 rounded-full" />
            <div className="flex gap-1.5">
              <Bone className="h-7 w-7 rounded-md" />
              <Bone className="h-7 w-7 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
