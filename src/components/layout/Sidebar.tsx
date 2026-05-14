"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/sources", label: "Sources", icon: Radio },
  { href: "/dashboard/events", label: "Events", icon: Zap },
  { href: "/dashboard/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: Columns3 },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
];

const adminItems = [
  { href: "/admin", label: "Admin Panel", icon: Shield },
  { href: "/admin/accounts", label: "Manage Accounts", icon: Settings },
  { href: "/admin/pipeline", label: "Run Pipeline", icon: Zap },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="size-3.5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground leading-none">Creator OS</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Web3 Intelligence</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
          Dashboard
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "size-4 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                )}
              />
              {item.label}
              {isActive && <ChevronRight className="size-3 ml-auto text-primary" />}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
            Admin
          </p>
          {adminItems.map((item) => {
            const isActive =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors group",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "size-4 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                  )}
                />
                {item.label}
                {isActive && <ChevronRight className="size-3 ml-auto text-primary" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground">Phase 1 · Web3 Creator OS</p>
      </div>
    </aside>
  );
}
