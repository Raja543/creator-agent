import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Shield, Users, Radio, Zap, Lightbulb, Database, ArrowRight } from "lucide-react";
import { ECO_STAT } from "@/lib/ecosystem-colors";

export const dynamic = "force-dynamic";

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

  const statCards = [
    {
      label: "Total Accounts",
      value: stats.total,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-gradient-to-br from-blue-400/20 to-blue-400/5",
      glow: "bg-blue-400",
    },
    {
      label: "Active Accounts",
      value: stats.active,
      icon: Radio,
      color: "text-green-400",
      bg: "bg-gradient-to-br from-green-400/20 to-green-400/5",
      glow: "bg-green-400",
    },
    {
      label: "Total Events",
      value: stats.events,
      icon: Zap,
      color: "text-amber-400",
      bg: "bg-gradient-to-br from-amber-400/20 to-amber-400/5",
      glow: "bg-amber-400",
    },
    {
      label: "Tweets Collected",
      value: stats.tweets,
      icon: Database,
      color: "text-violet-400",
      bg: "bg-gradient-to-br from-violet-400/20 to-violet-400/5",
      glow: "bg-violet-400",
    },
  ];

  const quickLinks = [
    {
      href: "/admin/accounts",
      label: "Manage Accounts",
      description: "Add, edit, categorize, and prioritize X accounts by ecosystem",
      icon: Users,
      count: stats.total,
      countLabel: "total accounts",
      color: "text-blue-400",
      bg: "bg-gradient-to-br from-blue-400/15 to-blue-400/5",
    },
    {
      href: "/dashboard/sources",
      label: "View Sources",
      description: "See all tracked accounts in dashboard view",
      icon: Radio,
      count: stats.active,
      countLabel: "active",
      color: "text-green-400",
      bg: "bg-gradient-to-br from-green-400/15 to-green-400/5",
    },
    {
      href: "/dashboard/events",
      label: "Events",
      description: "Browse detected ecosystem events",
      icon: Zap,
      count: stats.events,
      countLabel: "events",
      color: "text-amber-400",
      bg: "bg-gradient-to-br from-amber-400/15 to-amber-400/5",
    },
    {
      href: "/dashboard/ideas",
      label: "Content Ideas",
      description: "Manage generated content opportunities",
      icon: Lightbulb,
      count: stats.ideas,
      countLabel: "ideas",
      color: "text-violet-400",
      bg: "bg-gradient-to-br from-violet-400/15 to-violet-400/5",
    },
  ];

  const ecosystems = [
    { label: "Ronin", count: stats.ronin, color: ECO_STAT.ronin, dot: "bg-sky-400", glow: "bg-sky-400" },
    { label: "Immutable", count: stats.immutable, color: ECO_STAT.immutable, dot: "bg-purple-400", glow: "bg-purple-400" },
    { label: "Abstract", count: stats.abstract, color: ECO_STAT.abstract, dot: "bg-emerald-400", glow: "bg-emerald-400" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Shield className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Configure and manage your Creator OS</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="relative bg-card border border-border rounded-xl p-5 overflow-hidden">
            <div className={`absolute -top-4 -right-4 size-20 rounded-full blur-2xl opacity-20 ${card.glow}`} />
            <div className="relative">
              <div className={`size-10 rounded-xl ${card.bg} flex items-center justify-center mb-4`}>
                <card.icon className={`size-5 ${card.color}`} />
              </div>
              <p className={`text-4xl font-black ${card.color}`}>{card.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-1.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ecosystem breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {ecosystems.map((eco) => {
          const [textColor, bgColor] = eco.color.split(" ");
          return (
            <div key={eco.label} className={`relative rounded-xl p-5 overflow-hidden border border-border ${bgColor}`}>
              <div className={`absolute -top-3 -right-3 size-14 rounded-full blur-xl opacity-30 ${eco.glow}`} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`size-2 rounded-full ${eco.dot}`} />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{eco.label}</span>
                </div>
                <p className={`text-4xl font-black ${textColor}`}>{eco.count}</p>
                <p className="text-xs text-muted-foreground mt-1">accounts</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-card border border-border rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 group"
          >
            <div className="flex items-start gap-4">
              <div className={`size-10 rounded-xl ${link.bg} flex items-center justify-center shrink-0`}>
                <link.icon className={`size-5 ${link.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-bold text-foreground">{link.label}</p>
                  <ArrowRight className={`size-4 text-muted-foreground group-hover:${link.color} transition-colors`} />
                </div>
                <p className="text-sm text-muted-foreground">{link.description}</p>
                <p className={`text-sm font-black mt-2 ${link.color}`}>
                  {link.count} <span className="font-normal text-xs text-muted-foreground">{link.countLabel}</span>
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
