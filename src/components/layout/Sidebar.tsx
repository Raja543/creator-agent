"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  Zap,
  Lightbulb,
  Columns3,
  Activity,
  Settings,
  Shield,
  ChevronRight,
  ChevronLeft,
  FileText,
  Menu,
  X,
  Mail,
  LogOut,
  HelpCircle,
  MessageSquarePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/sources", label: "Sources", icon: Radio },
  { href: "/dashboard/events", label: "Events", icon: Zap },
  { href: "/dashboard/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/dashboard/summaries", label: "Reports", icon: FileText },
  { href: "/dashboard/workflow", label: "Workflow", icon: Columns3 },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/help", label: "How it works", icon: HelpCircle },
];

const FEEDBACK_EMAIL = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL;

const adminItems = [
  { href: "/admin", label: "Admin Panel", icon: Shield },
  { href: "/admin/accounts", label: "Manage Accounts", icon: Settings },
  { href: "/admin/pipeline", label: "Run Pipeline", icon: Zap },
  { href: "/admin/invites", label: "Invites", icon: Mail },
];

function NavLink({
  item,
  onClick,
  collapsed,
}: {
  item: { href: string; label: string; icon: React.ElementType };
  onClick?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const isActive =
    item.href === "/dashboard" || item.href === "/admin"
      ? pathname === item.href
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md text-sm transition-all duration-150 group relative",
        collapsed ? "px-2 py-2 justify-center" : "px-2 py-1.5",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      )}
    >
      <item.icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
        )}
      />
      {!collapsed && item.label}
      {!collapsed && isActive && (
        <ChevronRight className="size-3 ml-auto text-primary" />
      )}
    </Link>
  );
}

function SidebarContent({ onClose, collapsed, onToggleCollapse, isAdmin }: { onClose?: () => void; collapsed?: boolean; onToggleCollapse?: () => void; isAdmin?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser()
      .then(({ data: { user } }) => {
        // Prefer the name set at signup; fall back to the email's local part
        const fullName = user?.user_metadata?.full_name as string | undefined;
        setName(fullName?.trim() || user?.email?.split("@")[0] || null);
      })
      .catch(() => {});
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Logo */}
      <div className={cn(
        "border-b border-sidebar-border flex items-center",
        collapsed ? "px-2 py-5 justify-center" : "px-5 py-5 justify-between"
      )}>
        {collapsed ? (
          <div className="size-8 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/40">
            <Zap className="size-4 text-primary-foreground" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/40">
                <Zap className="size-4 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-sidebar-foreground leading-none">Creator OS</p>
                  {process.env.NEXT_PUBLIC_APP_ENV === "beta" && (
                    <span style={{
                      fontFamily: "var(--font-geist-mono)", fontSize: 8.5, fontWeight: 700,
                      letterSpacing: "0.08em", color: "var(--signal)",
                      background: "var(--signal-dim)", border: "1px solid rgba(74,222,128,0.25)",
                      borderRadius: 4, padding: "1px 5px", lineHeight: 1.4,
                    }}>
                      BETA
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Web3 Intel</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors md:hidden"
              >
                <X className="size-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
            Dashboard
          </p>
        )}
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={onClose} collapsed={collapsed} />
        ))}

        <div className="pt-4">
          {!collapsed && (
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
              Admin
            </p>
          )}
          {adminItems.map((item) => {
            if (item.href === "/admin/invites" && !isAdmin) return null;
            return <NavLink key={item.href} item={item} onClick={onClose} collapsed={collapsed} />;
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-sidebar-border", collapsed ? "px-2 py-3" : "px-3 py-3")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <span className="relative flex size-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-green-400" />
            </span>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <LogOut className="size-3.5" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title="Expand sidebar"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* User row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-primary uppercase">
                    {name ? name[0] : "?"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground truncate capitalize">{name ?? "..."}</span>
              </div>
              <button
                onClick={signOut}
                title="Sign out"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors shrink-0"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
            {/* Send feedback — opens Gmail compose in a new tab (works without a
                desktop mail client; mailto silently fails when none is set) */}
            {FEEDBACK_EMAIL && (
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(FEEDBACK_EMAIL)}&su=${encodeURIComponent("Creator OS Beta feedback")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
                <MessageSquarePlus className="size-3.5 shrink-0" />
                Send feedback
              </a>
            )}
            {/* System status + collapse */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-green-400" />
                </span>
                <span className="text-xs text-muted-foreground">System Active</span>
              </div>
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  title="Collapse sidebar"
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
                >
                  <ChevronLeft className="size-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function Sidebar({ isAdmin }: { isAdmin?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Always start false to match server render, then sync from localStorage after mount
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "true");
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "hidden md:flex shrink-0 flex-col bg-sidebar border-r border-sidebar-border h-screen transition-all duration-200",
          collapsed ? "w-14" : "w-56"
        )}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={toggleCollapsed} isAdmin={isAdmin} />
      </aside>

      {/* ── Mobile: hamburger trigger ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3.5 left-4 z-50 md:hidden size-9 flex items-center justify-center rounded-lg bg-sidebar border border-sidebar-border text-sidebar-foreground shadow-sm"
        aria-label="Open menu"
      >
        <Menu className="size-4" />
      </button>

      {/* ── Mobile: backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile: drawer ── */}
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-sidebar border-r border-sidebar-border md:hidden">
          <SidebarContent onClose={() => setMobileOpen(false)} isAdmin={isAdmin} />
        </aside>
      )}
    </>
  );
}
