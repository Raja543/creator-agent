"use client";

import { useRouter, useSearchParams } from "next/navigation";

const ECOSYSTEM_TABS = [
  { value: "all", label: "All" },
  { value: "ronin", label: "Ronin" },
  { value: "immutable", label: "Immutable" },
  { value: "abstract", label: "Abstract" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "score", label: "Highest Score" },
];

const EVENT_CATEGORIES = [
  "campaign", "launch", "partnership", "migration", "staking",
  "gameplay", "tournament", "funding", "metrics", "token", "nft",
  "patch", "leaderboard", "other",
];

export function EventsFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const activeEco = params.get("ecosystem") ?? "all";
  const activeCategory = params.get("category") ?? "all";
  const activeSort = params.get("sort") ?? "newest";

  function navigate(eco: string, cat: string, srt: string) {
    const p = new URLSearchParams();
    if (eco !== "all") p.set("ecosystem", eco);
    if (cat !== "all") p.set("category", cat);
    if (srt !== "newest") p.set("sort", srt);
    const qs = p.toString();
    router.push(`/dashboard/events${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="space-y-3">
      {/* Ecosystem tabs + sort */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          {ECOSYSTEM_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => navigate(tab.value, activeCategory, activeSort)}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                activeEco === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => navigate(activeEco, activeCategory, opt.value)}
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

      {/* Category pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => navigate(activeEco, "all", activeSort)}
          className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
            activeCategory === "all"
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted"
          }`}
        >
          All Categories
        </button>
        {EVENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => navigate(activeEco, cat, activeSort)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize transition-colors ${
              activeCategory === cat
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
