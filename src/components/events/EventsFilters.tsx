"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useState } from "react";

const ECOSYSTEM_TABS = [
  { value: "all", label: "All" },
  { value: "ronin", label: "Ronin" },
  { value: "immutable", label: "Immutable" },
  { value: "abstract", label: "Abstract" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "score", label: "Top Score" },
];

const SCORE_OPTIONS = [
  { value: "all", label: "All Scores" },
  { value: "8", label: "8+ High" },
  { value: "6", label: "6+ Mid" },
  { value: "4", label: "4+ Low" },
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
  const activeScore = params.get("minScore") ?? "all";
  const activeQ = params.get("q") ?? "";

  const [searchInput, setSearchInput] = useState(activeQ);

  function navigate(eco: string, cat: string, srt: string, score: string, q: string) {
    const p = new URLSearchParams();
    if (eco !== "all") p.set("ecosystem", eco);
    if (cat !== "all") p.set("category", cat);
    if (srt !== "newest") p.set("sort", srt);
    if (score !== "all") p.set("minScore", score);
    if (q) p.set("q", q);
    const qs = p.toString();
    router.push(`/dashboard/events${qs ? `?${qs}` : ""}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(activeEco, activeCategory, activeSort, activeScore, searchInput.trim());
  }

  function clearSearch() {
    setSearchInput("");
    navigate(activeEco, activeCategory, activeSort, activeScore, "");
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search events by title or summary…"
          className="w-full bg-input border border-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
        />
        {searchInput && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
      </form>

      {/* Ecosystem tabs + sort + score — stack on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {ECOSYSTEM_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => navigate(tab.value, activeCategory, activeSort, activeScore, activeQ)}
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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Score filter */}
          <select
            value={activeScore}
            onChange={(e) => navigate(activeEco, activeCategory, activeSort, e.target.value, activeQ)}
            className="bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            {SCORE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Sort toggle */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => navigate(activeEco, activeCategory, opt.value, activeScore, activeQ)}
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

      {/* Category pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => navigate(activeEco, "all", activeSort, activeScore, activeQ)}
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
            onClick={() => navigate(activeEco, cat, activeSort, activeScore, activeQ)}
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
