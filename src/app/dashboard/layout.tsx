import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar — gives space for the fixed hamburger button */}
        <div className="md:hidden flex items-center h-14 px-4 pl-16 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
          <p className="text-sm font-semibold text-foreground">Creator OS</p>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
