"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

const ROUTE_NAMES: Record<string, string> = {
  "/dashboard":           "Overview",
  "/dashboard/sources":   "Sources",
  "/dashboard/events":    "Events",
  "/dashboard/ideas":     "Ideas",
  "/dashboard/summaries": "Reports",
  "/dashboard/workflow":  "Workflow",
  "/dashboard/activity":  "Activity",
  "/admin":               "Admin Panel",
  "/admin/accounts":      "Accounts",
  "/admin/pipeline":      "Run Pipeline",
  "/admin/invites":       "Invites",
};

export function Topbar() {
  const pathname = usePathname();
  const [time, setTime] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      const hh = now.getUTCHours().toString().padStart(2, "0");
      const mm = now.getUTCMinutes().toString().padStart(2, "0");
      const ss = now.getUTCSeconds().toString().padStart(2, "0");
      setTime(`${hh}:${mm}:${ss}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const section = pathname.startsWith("/admin") ? "Admin" : "Operations";
  const page    = ROUTE_NAMES[pathname] ?? "Overview";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        padding: "0 20px",
        height: 44,
        borderBottom: "1px solid var(--hairline)",
        background: "var(--bg-elev)",
        flexShrink: 0,
        minWidth: 0,
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", fontFamily: "var(--font-geist-mono)", fontSize: 11.5, whiteSpace: "nowrap", flexShrink: 0 }}>
        <span style={{ color: "var(--fg-4)" }}>{section}</span>
        <span style={{ color: "var(--fg-5)", margin: "0 7px" }}>/</span>
        <span style={{ color: "var(--fg)", fontWeight: 600 }}>{page}</span>
      </div>

      {/* Search */}
      <div
        style={{
          flex: "1 1 0",
          minWidth: 0,
          maxWidth: 300,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 7,
          background: "var(--surface-2)",
          border: "1px solid var(--hairline)",
          borderRadius: 6,
          padding: "5px 10px",
          fontFamily: "var(--font-geist-mono)",
          fontSize: 11,
          color: "var(--fg-4)",
          cursor: "text",
          userSelect: "none",
        }}
      >
        <Search style={{ width: 12, height: 12, flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          Search events, ideas, sources...
        </span>
        <kbd
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 9.5,
            color: "var(--fg-5)",
            background: "var(--surface-3)",
            border: "1px solid var(--hairline)",
            borderRadius: 3,
            padding: "1px 5px",
            flexShrink: 0,
          }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Right: clock + LIVE + bell */}
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          fontFamily: "var(--font-geist-mono)",
          fontSize: 11,
          flexShrink: 0,
        }}
      >
        {time && (
          <span style={{ color: "var(--fg-4)", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M6 3v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {time} UTC
          </span>
        )}

        <span style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--signal)",
              display: "inline-block",
              boxShadow: "0 0 6px var(--signal)",
              flexShrink: 0,
            }}
          />
          <span style={{ color: "var(--signal)", fontWeight: 700, letterSpacing: "0.06em" }}>LIVE</span>
        </span>

      </div>
    </div>
  );
}
