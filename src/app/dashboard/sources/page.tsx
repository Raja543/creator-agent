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
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-5">
        {ECOSYSTEM_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "all" ? "/dashboard/sources" : `/dashboard/sources?ecosystem=${tab.value}`}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              activeFilter === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">
          Failed to load sources: {error.message}
        </div>
      )}

      <SourcesClient key={activeFilter} initialSources={sources} activeFilter={activeFilter} />
    </div>
  );
}
