import { Radio, Cpu, FileText, Lightbulb, Columns3, Play, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    icon: Radio,
    color: "#06b6d4",
    title: "1 · Add your sources",
    body: "Add the X (Twitter) accounts you want to track: projects, founders, media, anyone relevant to the web3 ecosystems you cover. Tag each with an ecosystem and category (you make these up; type anything).",
    href: "/dashboard/sources",
    cta: "Add sources",
  },
  {
    icon: Cpu,
    color: "#8b5cf6",
    title: "2 · Run the pipeline",
    body: "The pipeline collects recent tweets from your sources, filters out noise, and uses AI to detect genuinely newsworthy events, scoring each on importance and clustering similar ones together.",
    href: "/admin/pipeline",
    cta: "Run pipeline",
  },
  {
    icon: Lightbulb,
    color: "#f59e0b",
    title: "3 · Get events, ideas & reports",
    body: "Detected events appear in Events. The AI turns the strongest ones into ready-to-use content ideas, and writes an ecosystem briefing (Reports) so you know what to post about today.",
    href: "/dashboard/events",
    cta: "Browse events",
  },
  {
    icon: Columns3,
    color: "#4ade80",
    title: "4 · Work it through the pipeline",
    body: "Move content ideas across the Workflow board (Idea → Draft → Preparing → Review → Published) so you always know what's in progress.",
    href: "/dashboard/workflow",
    cta: "Open workflow",
  },
];

export default function HelpPage() {
  return (
    <div className="cos-page space-y-5">
      <div className="cos-page-head">
        <div className="cos-eyebrow">Welcome</div>
        <h1 className="cos-page-title">How Creator OS works</h1>
        <p className="cos-page-sub">
          Your AI intelligence desk for web3 content. It watches the accounts you care about, surfaces what
          actually matters, and turns it into content ideas, so you spend less time scrolling and more time posting.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((s) => (
          <div key={s.title} className="cos-card" style={{ padding: 18, display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              display: "grid", placeItems: "center",
              background: `${s.color}1f`, border: `1px solid ${s.color}40`, color: s.color,
            }}>
              <s.icon style={{ width: 18, height: 18 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>{s.title}</div>
              <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.6, margin: "0 0 10px" }}>{s.body}</p>
              <Link href={s.href} className="cos-btn-ghost" style={{ fontSize: 12, gap: 6 }}>
                {s.cta} <ArrowRight style={{ width: 12, height: 12 }} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="cos-card" style={{ padding: "16px 20px", fontSize: 12.5, lineHeight: 1.7, color: "var(--fg-3)" }}>
        <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--signal)", marginBottom: 10 }}>
          Good to know
        </div>
        <p style={{ margin: "0 0 8px" }}>
          <strong style={{ color: "var(--fg-2)" }}>Ecosystems & categories are yours.</strong> There's no fixed list.
          Type whatever fits your niche (Solana, DeFi, NFTs, a specific game). Filters and colors adapt automatically.
        </p>
        <p style={{ margin: "0 0 8px" }}>
          <strong style={{ color: "var(--fg-2)" }}>Quality over quantity.</strong> The AI only surfaces events it scores
          as genuinely newsworthy, and skips hype, giveaways, and GM posts.
        </p>
        <p style={{ margin: 0 }}>
          <strong style={{ color: "var(--fg-2)" }}>It improves with sources.</strong> The more relevant accounts you
          track, the sharper the signal. Start with 10–20 high-signal accounts.
        </p>
      </div>

      {/* Get started CTA */}
      <div className="cos-card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, background: "var(--signal-glow)", borderColor: "rgba(74,222,128,.2)" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--signal-dim)", border: "1px solid rgba(74,222,128,.25)", color: "var(--signal)", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Play style={{ width: 18, height: 18 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>Ready to start?</div>
          <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>Add a few sources, then run the pipeline to see your first signals.</div>
        </div>
        <Link href="/dashboard/sources" className="cos-btn-primary" style={{ flexShrink: 0 }}>Add sources</Link>
      </div>
    </div>
  );
}
