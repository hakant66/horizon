"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Settings2, ClipboardList, MessageSquare, Target,
  Database, Wind, AlertTriangle, TrendingUp, FileText, Award,
  History, SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import type { NavIconName } from "@/lib/constants";
import { useI18n } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

const ICONS: Record<NavIconName, LucideIcon> = {
  LayoutDashboard,
  Settings2,
  ClipboardList,
  MessageSquare,
  Target,
  Database,
  Wind,
  AlertTriangle,
  TrendingUp,
  FileText,
  Award,
  History,
  SlidersHorizontal,
};

/**
 * Props:
 * - collapsed: tablet mode — show only icons
 * - onNavigate: called after a link click (to close mobile drawer)
 */
export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-200",
        collapsed ? "w-14" : "w-64",
      )}
    >
      {/* Logo / Brand */}
      <div className={cn(
        "flex items-center gap-2 border-b border-slate-100 px-3 py-4",
        collapsed ? "justify-center" : "",
      )}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
          H
        </span>
        {!collapsed && (
          <span className="text-sm font-semibold text-slate-800 leading-tight">
            Horizon<br />
            <span className="text-xs font-normal text-slate-400">Sustainability</span>
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {!collapsed && (
          <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {t("workflow")}
          </p>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? t(item.labelKey) : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md py-2 text-sm transition-colors",
                collapsed ? "justify-center px-2" : "px-3",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
              {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
