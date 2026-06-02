import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getRequestIsAdmin } from "@/lib/auth-headers";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await getRequestIsAdmin();

  return (
    <div className="h-screen overflow-hidden bg-background" style={{ display: "grid", gridTemplateColumns: "auto 1fr" }}>
      <Sidebar isAdmin={isAdmin} />
      <div className="flex flex-col min-w-0 overflow-hidden transition-all duration-200">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center h-14 px-4 pl-16 border-b border-border shrink-0" style={{ background: "var(--bg-elev)" }}>
          <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 600, color: "var(--fg)", letterSpacing: "0.04em" }}>Creator OS</p>
        </div>
        {/* Desktop topbar */}
        <div className="hidden md:block shrink-0">
          <Topbar />
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
