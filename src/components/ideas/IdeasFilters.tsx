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
      {/* Format tabs + sort */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {FORMAT_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => navigate(tab.value, activePotential, activeSort)}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeFormat === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 shrink-0">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => navigate(activeFormat, activePotential, opt.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
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

      {/* Potential pills */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Potential:</span>
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
    </div>
  );
}
