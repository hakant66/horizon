"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { useI18n } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

export function SidebarNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white p-4">
      <h2 className="px-2 pb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{t("workflow")}</h2>
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
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
