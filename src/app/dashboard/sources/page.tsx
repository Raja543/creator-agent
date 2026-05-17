import { supabase } from "@/lib/supabase";
import { SourcesClient } from "@/components/sources/SourcesClient";
import Link from "next/link";
import type { Ecosystem } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const ECOSYSTEM_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ronin", label: "Ronin" },
  { value: "immutable", label: "Immutable" },
  { value: "abstract", label: "Abstract" },
];

interface PageProps {
  searchParams: Promise<{ ecosystem?: string }>;
}

export default async function SourcesPage({ searchParams }: PageProps) {
  const { ecosystem } = await searchParams;
  const activeFilter = ecosystem ?? "all";

  let query = supabase
    .from("accounts")
    .select("*")
    .order("priority", { ascending: false });

  if (activeFilter !== "all") {
    query = query.eq("ecosystem", activeFilter as Ecosystem);
  }

  const { data, error } = await query;
  const sources = data ?? [];

  return (
    <div className="cos-page space-y-4">
      <div className="cos-page-head">
        <div className="cos-eyebrow">ACCOUNTS</div>
        <h1 className="cos-page-title">Sources</h1>
        <p className="cos-page-sub">Tracked accounts across all monitored ecosystems. {sources.length} active.</p>
      </div>

      <div className="cos-filter-bar">
        {ECOSYSTEM_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "all" ? "/dashboard/sources" : `/dashboard/sources?ecosystem=${tab.value}`}
            className={`cos-fchip ${activeFilter === tab.value ? "active" : ""}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "var(--rose-dim)", color: "var(--rose)", border: "1px solid rgba(244,63,94,.2)" }}>
          Failed to load sources: {error.message}
        </div>
      )}

      <SourcesClient key={activeFilter} initialSources={sources} activeFilter={activeFilter} />
    </div>
  );
}
