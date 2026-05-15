function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted/60 rounded ${className}`} />;
}

export default function ActivityLoading() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <Bone className="h-8 w-36 rounded-lg" />
        <Bone className="h-4 w-52" />
      </div>

      <div className="space-y-8">
        {[...Array(2)].map((_, g) => (
          <div key={g}>
            <div className="flex items-center gap-3 mb-5">
              <Bone className="h-6 w-16 rounded-full" />
              <div className="flex-1 h-px bg-border" />
              <Bone className="h-5 w-6 rounded-full" />
            </div>
            <div className="space-y-0.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4 pb-4">
                  <div className="flex flex-col items-center shrink-0">
                    <Bone className="size-10 rounded-xl" />
                    {i < 4 && <div className="w-px flex-1 bg-border/50 mt-1 min-h-5" />}
                  </div>
                  <div className="flex-1 pt-1.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <Bone className="h-3 w-24" />
                        <Bone className="h-4 w-full" />
                        <Bone className="h-4 w-4/5" />
                      </div>
                      <Bone className="h-3 w-12 shrink-0" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
