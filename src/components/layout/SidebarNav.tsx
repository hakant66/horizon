"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white p-4">
      <h2 className="px-2 pb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Workflow</h2>
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm",
              pathname.startsWith(item.href) ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
