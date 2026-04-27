import { SidebarNav } from "@/components/layout/SidebarNav";
import { TopBar } from "@/components/layout/TopBar";

export function AppShell({
  children,
  orgName,
  period,
  userName,
}: {
  children: React.ReactNode;
  orgName: string;
  period: string;
  userName: string;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <div className="hidden md:block">
        <SidebarNav />
      </div>
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar orgName={orgName} period={period} userName={userName} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
