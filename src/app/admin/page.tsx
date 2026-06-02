import { createClient } from "@/lib/supabase-server";
import { getRequestUserId } from "@/lib/auth-headers";
import Link from "next/link";
import { Users, Radio, Zap, Lightbulb, Database, FileText, Play, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [userId, supabase] = await Promise.all([getRequestUserId(), createClient()]);

  const [accounts, activeAccounts, events, ideas, tweets, byEco] = await Promise.all([
    supabase.from("accounts").select("id", { count: "exact" }).eq("user_id", userId!),
    supabase.from("accounts").select("id", { count: "exact" }).eq("user_id", userId!).eq("active", true),
    supabase.from("events").select("id", { count: "exact" }).eq("user_id", userId!).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
    supabase.from("content_ideas").select("id", { count: "exact" }).eq("user_id", userId!),
    supabase.from("tweets").select("id", { count: "exact" }).eq("user_id", userId!),
    Promise.all([
      supabase.from("accounts").select("id", { count: "exact" }).eq("user_id", userId!).eq("ecosystem", "ronin"),
      supabase.from("accounts").select("id", { count: "exact" }).eq("user_id", userId!).eq("ecosystem", "immutable"),
      supabase.from("accounts").select("id", { count: "exact" }).eq("user_id", userId!).eq("ecosystem", "abstract"),
    ]),
  ]);

  const stats = {
    total: accounts.count ?? 0,
    active: activeAccounts.count ?? 0,
    events: events.count ?? 0,
    ideas: ideas.count ?? 0,
    tweets: tweets.count ?? 0,
    ronin: byEco[0].count ?? 0,
    immutable: byEco[1].count ?? 0,
    abstract: byEco[2].count ?? 0,
  };

  const kpis = [
    { label: "TOTAL ACCOUNTS",   value: stats.total,  icon: Users,    color: "#06b6d4", bg: "rgba(6,182,212,0.12)",   sub: "all ecosystems" },
    { label: "ACTIVE ACCOUNTS",  value: stats.active, icon: Radio,    color: "#4ade80", bg: "rgba(74,222,128,0.08)",  sub: "currently tracked" },
    { label: "EVENTS · 24H",     value: stats.events, icon: Zap,      color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  sub: "last 24 hours" },
    { label: "TWEETS COLLECTED", value: stats.tweets, icon: Database, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  sub: "all-time" },
  ];

  const ecosystems = [
    { key: "ronin",     label: "Ronin",     count: stats.ronin,     color: "#3b82f6" },
    { key: "immutable", label: "Immutable", count: stats.immutable,  color: "#a855f7" },
    { key: "abstract",  label: "Abstract",  count: stats.abstract,   color: "#10b981" },
  ];

  const ACTION_TONE_COLORS: Record<string, string> = {
    ronin:  "rgba(59,130,246,0.45)",
    signal: "rgba(74,222,128,0.45)",
    amber:  "rgba(245,158,11,0.45)",
    violet: "rgba(139,92,246,0.45)",
  };

  const actions = [
    { href: "/admin/accounts",     icon: Users,     tone: "ronin",   title: "Manage accounts",  desc: "Add, edit, categorize, and prioritize X accounts by ecosystem",       note: `${stats.total} total · 3 ecosystems` },
    { href: "/dashboard/sources",  icon: Radio,     tone: "signal",  title: "View sources",     desc: "See all tracked accounts in dashboard view",                          note: `${stats.active} active` },
    { href: "/dashboard/events",   icon: Zap,       tone: "amber",   title: "Browse events",    desc: "Inspect detected ecosystem events with full context",                  note: `${stats.events} events · 24h` },
    { href: "/dashboard/ideas",    icon: Lightbulb, tone: "violet",  title: "Content ideas",    desc: "Manage generated content opportunities",                               note: `${stats.ideas} ideas` },
    { href: "/dashboard/summaries",icon: FileText,  tone: "ronin",   title: "Intel reports",    desc: "Review auto-summarized ecosystem briefings",                           note: "Updated every 4h" },
    { href: "/admin/pipeline",      icon: Play,      tone: "signal",  title: "Run pipeline",     desc: "Collect → process → summarize → ideate, end-to-end",                  note: "Manual trigger" },
  ];

  return (
    <div className="cos-page space-y-4">
      <div className="cos-page-head">
        <div className="cos-eyebrow">CONTROL</div>
        <h1 className="cos-page-title">Admin panel</h1>
        <p className="cos-page-sub">System health, account distribution, and direct access to every operator surface.</p>
      </div>

      <div className="cos-kpi-grid">
        {kpis.map((kpi) => (
          <div key={kpi.label} style={{ background: `linear-gradient(135deg, ${kpi.bg} 0%, var(--surface) 65%)`, border: "1px solid var(--hairline)", borderRadius: 10, padding: "18px 20px 16px" }}>
            <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-4)", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <kpi.icon style={{ width: 13, height: 13 }} />
              {kpi.label}
            </div>
            <div style={{ fontSize: 46, fontWeight: 700, color: kpi.color, lineHeight: 1, marginBottom: 10 }}>{kpi.value}</div>
            <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--fg-4)" }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="cos-divider">Ecosystem distribution</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ecosystems.map((eco) => {
          const share = stats.total > 0 ? Math.round((eco.count / stats.total) * 100) : 0;
          return (
            <div key={eco.key} className={`cos-eco-card ${eco.key}`}>
              <div className="cos-eco-label"><span className="dot" />{eco.label}</div>
              <div className="cos-eco-count" style={{ color: eco.color }}>{eco.count} <span>accounts</span></div>
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-geist-mono)", fontSize: 10.5, color: "var(--fg-4)", marginBottom: 4 }}>
                  <span>Share</span><span style={{ color: eco.color }}>{share}%</span>
                </div>
                <div className="cos-pipe-track"><div className="cos-pipe-fill" style={{ width: `${share}%`, background: eco.color }} /></div>
              </div>
              <div className="cos-eco-foot"><span>{eco.count} sources</span><span style={{ color: eco.color }}>{share}%</span></div>
            </div>
          );
        })}
      </div>

      <div className="cos-divider">Quick actions</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className="cos-action-card" style={{ borderTop: `2px solid ${ACTION_TONE_COLORS[action.tone] ?? "rgba(255,255,255,0.12)"}` }}>
            <div className={`cos-action-icon ${action.tone}`}><action.icon style={{ width: 16, height: 16 }} /></div>
            <div className="cos-action-meta">
              <div className="cos-action-title">{action.title}</div>
              <div className="cos-action-desc">{action.desc}</div>
              <div className="cos-action-note">{action.note}</div>
            </div>
            <ArrowRight className="cos-action-arrow" />
          </Link>
        ))}
      </div>
    </div>
  );
}
