import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Shield, Users, Radio, Zap, Lightbulb, Database, ArrowRight } from "lucide-react";

async function getAdminStats() {
  const [accounts, activeAccounts, events, ideas, tweets] = await Promise.all([
    supabase.from("accounts").select("id", { count: "exact" }),
    supabase.from("accounts").select("id", { count: "exact" }).eq("active", true),
    supabase.from("events").select("id", { count: "exact" }),
    supabase.from("content_ideas").select("id", { count: "exact" }),
    supabase.from("tweets").select("id", { count: "exact" }),
  ]);

  const byEcosystem = await Promise.all([
    supabase.from("accounts").select("id", { count: "exact" }).eq("ecosystem", "ronin"),
    supabase.from("accounts").select("id", { count: "exact" }).eq("ecosystem", "immutable"),
    supabase.from("accounts").select("id", { count: "exact" }).eq("ecosystem", "abstract"),
  ]);

  return {
    total: accounts.count ?? 0,
    active: activeAccounts.count ?? 0,
    events: events.count ?? 0,
    ideas: ideas.count ?? 0,
    tweets: tweets.count ?? 0,
    ronin: byEcosystem[0].count ?? 0,
    immutable: byEcosystem[1].count ?? 0,
    abstract: byEcosystem[2].count ?? 0,
  };
}

export default async function AdminPage() {
  const stats = await getAdminStats();

  const quickLinks = [
    {
      href: "/admin/accounts",
      label: "Manage Accounts",
      description: "Add, edit, categorize, and prioritize X accounts by ecosystem",
      icon: Users,
      count: stats.total,
      countLabel: "total accounts",
    },
    {
      href: "/dashboard/sources",
      label: "View Sources",
      description: "See all tracked accounts in dashboard view",
      icon: Radio,
      count: stats.active,
      countLabel: "active",
    },
    {
      href: "/dashboard/events",
      label: "Events",
      description: "Browse detected ecosystem events",
      icon: Zap,
      count: stats.events,
      countLabel: "events",
    },
    {
      href: "/dashboard/ideas",
      label: "Content Ideas",
      description: "Manage generated content opportunities",
      icon: Lightbulb,
      count: stats.ideas,
      countLabel: "ideas",
    },
  ];

  const ecosystems = [
    { label: "Ronin", count: stats.ronin, color: "text-blue-400 bg-blue-400/10" },
    { label: "Immutable", count: stats.immutable, color: "text-cyan-400 bg-cyan-400/10" },
    { label: "Abstract", count: stats.abstract, color: "text-violet-400 bg-violet-400/10" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <Shield className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Configure and manage your Creator OS</p>
        </div>
      </div>

      {/* System overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Accounts", value: stats.total, icon: Users },
          { label: "Active Accounts", value: stats.active, icon: Radio },
          { label: "Total Events", value: stats.events, icon: Zap },
          { label: "Tweets Collected", value: stats.tweets, icon: Database },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Ecosystem breakdown */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold text-foreground mb-4">Ecosystem Breakdown</h2>
        <div className="grid grid-cols-3 gap-4">
          {ecosystems.map((eco) => (
            <div key={eco.label} className={`rounded-xl p-4 ${eco.color.split(" ")[1]}`}>
              <p className={`text-2xl font-bold ${eco.color.split(" ")[0]}`}>{eco.count}</p>
              <p className="text-sm text-muted-foreground mt-1">{eco.label} accounts</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:bg-card/80 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <link.icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{link.label}</p>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{link.description}</p>
                <p className="text-xs text-primary mt-2">
                  {link.count} {link.countLabel}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Database schema info */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold text-foreground mb-3">Database Setup</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Run this SQL in your Supabase dashboard to initialize all required tables.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs text-muted-foreground overflow-x-auto">
          <pre>{SQL_SCHEMA}</pre>
        </div>
      </div>
    </div>
  );
}

const SQL_SCHEMA = `-- Accounts (X accounts to track)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  ecosystem TEXT CHECK (ecosystem IN ('ronin','immutable','abstract','other')),
  category TEXT CHECK (category IN ('official_game','ecosystem','founder','creator','analytics','media','guild','influencer')),
  priority INT DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  active BOOLEAN DEFAULT true,
  last_checked TIMESTAMP,
  notes TEXT,
  follower_count INT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tweets (raw collected tweets)
CREATE TABLE IF NOT EXISTS tweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tweet_id TEXT UNIQUE NOT NULL,
  username TEXT, display_name TEXT, content TEXT, url TEXT,
  likes INT DEFAULT 0, reposts INT DEFAULT 0, replies INT DEFAULT 0, views INT DEFAULT 0,
  posted_at TIMESTAMP, fetched_at TIMESTAMP DEFAULT NOW(),
  processed BOOLEAN DEFAULT false, raw_data JSONB
);

-- Events (detected ecosystem events)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT, summary TEXT,
  ecosystem TEXT, category TEXT,
  importance_score INT, keywords TEXT[], source_tweets JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Summaries (AI-generated ecosystem reports)
CREATE TABLE IF NOT EXISTS summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeframe TEXT, ecosystems TEXT[], content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content Ideas
CREATE TABLE IF NOT EXISTS content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT, description TEXT, format TEXT, angle TEXT,
  potential TEXT DEFAULT 'medium',
  source_events JSONB, status TEXT DEFAULT 'idea',
  notes TEXT, priority INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activities (system event log)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT, message TEXT, metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);`;
