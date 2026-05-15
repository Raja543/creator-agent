"use client";

import { useRouter, useSearchParams } from "next/navigation";

const FORMAT_TABS = [
  { value: "all", label: "All" },
  { value: "thread", label: "Thread" },
  { value: "infographic", label: "Infographic" },
  { value: "guide", label: "Guide" },
  { value: "comparison", label: "Comparison" },
  { value: "analysis", label: "Analysis" },
  { value: "narrative", label: "Narrative" },
  { value: "breakdown", label: "Breakdown" },
];

const POTENTIAL_FILTERS = [
  { value: "all", label: "All" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const SORT_OPTIONS = [
  { value: "priority", label: "Priority" },
  { value: "newest", label: "Newest" },
];

export function IdeasFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const activeFormat = params.get("format") ?? "all";
  const activePotential = params.get("potential") ?? "all";
  const activeSort = params.get("sort") ?? "priority";

  function navigate(fmt: string, pot: string, srt: string) {
    const p = new URLSearchParams();
    if (fmt !== "all") p.set("format", fmt);
    if (pot !== "all") p.set("potential", pot);
    if (srt !== "priority") p.set("sort", srt);
    const qs = p.toString();
    router.push(`/dashboard/ideas${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="space-y-3">
      {/* Format tabs — full width, horizontally scrollable with fade hint */}
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FORMAT_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => navigate(tab.value, activePotential, activeSort)}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeFormat === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Fade hint so user knows there's more to scroll */}
        <div className="absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>

      {/* Potential + Sort — on same row so they don't collapse each other */}
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground shrink-0">Potential:</span>
          {POTENTIAL_FILTERS.map((p) => (
            <button
              key={p.value}
              onClick={() => navigate(activeFormat, p.value, activeSort)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                activePotential === p.value
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 shrink-0">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => navigate(activeFormat, activePotential, opt.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                activeSort === opt.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
