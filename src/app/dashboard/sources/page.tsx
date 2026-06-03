import { createClient } from "@/lib/supabase-server";
import { getRequestUserId } from "@/lib/auth-headers";
import { SourcesClient } from "@/components/sources/SourcesClient";
import Link from "next/link";
import type { Ecosystem } from "@/lib/database.types";

export const dynamic = "force-dynamic";

function prettyLabel(v: string): string {
  return v.replace(/[_-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

interface PageProps {
  searchParams: Promise<{ ecosystem?: string }>;
}

export default async function SourcesPage({ searchParams }: PageProps) {
  const { ecosystem } = await searchParams;
  const activeFilter = ecosystem ?? "all";

  const [userId, supabase] = await Promise.all([getRequestUserId(), createClient()]);

  // Distinct ecosystems this user actually tracks → dynamic filter tabs
  const { data: allEcoRows } = await supabase
    .from("accounts")
    .select("ecosystem")
    .eq("user_id", userId!);
  const ecosystems = [
    ...new Set((allEcoRows ?? []).map((r) => r.ecosystem).filter(Boolean) as string[]),
  ].sort();

  let query = supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId!)
    .order("priority", { ascending: false });

  if (activeFilter !== "all") query = query.eq("ecosystem", activeFilter as Ecosystem);

  const { data, error } = await query;
  const sources = data ?? [];

  return (
    <div className="cos-page space-y-4">
      <div className="cos-page-head">
        <div className="cos-eyebrow">ACCOUNTS</div>
        <h1 className="cos-page-title">Sources</h1>
        <p className="cos-page-sub">Tracked accounts across all monitored ecosystems. {sources.length} active.</p>
      </div>
      {ecosystems.length > 0 && (
        <div className="cos-filter-bar">
          <Link
            href="/dashboard/sources"
            className={`cos-fchip ${activeFilter === "all" ? "active" : ""}`}
          >
            All
          </Link>
          {ecosystems.map((eco) => (
            <Link
              key={eco}
              href={`/dashboard/sources?ecosystem=${encodeURIComponent(eco)}`}
              className={`cos-fchip ${activeFilter === eco ? "active" : ""}`}
            >
              {prettyLabel(eco)}
            </Link>
          ))}
        </div>
      )}
      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "var(--rose-dim)", color: "var(--rose)", border: "1px solid rgba(244,63,94,.2)" }}>
          Failed to load sources: {error.message}
        </div>
      )}
      <SourcesClient key={activeFilter} initialSources={sources} activeFilter={activeFilter} />
    </div>
  );
}
