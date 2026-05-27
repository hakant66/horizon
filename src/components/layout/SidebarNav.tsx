"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Settings2, ClipboardList, MessageSquare, Target,
  Database, Wind, AlertTriangle, TrendingUp, FileText, Award,
  History, SlidersHorizontal, BookOpen,
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
  BookOpen,
};

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
        "flex h-full flex-col border-r border-slate-100 bg-slate-950 transition-all duration-200",
        collapsed ? "w-14" : "w-64",
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex items-center border-b border-slate-800 px-4 py-5",
          collapsed ? "justify-center px-0" : "",
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-black tracking-tight text-slate-950">
          H
        </div>
        {!collapsed && (
          <div className="ml-3 min-w-0">
            <p className="text-sm font-semibold leading-none text-white">Horizon</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-slate-500">
              Sustainability
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" aria-label="Main navigation">
        {!collapsed && (
          <p className="mb-1 px-3 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
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
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors",
                collapsed ? "justify-center px-2" : "px-3",
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon
                className={cn(
                  "shrink-0 transition-colors",
                  collapsed ? "h-5 w-5" : "h-4 w-4",
                  active ? "text-white" : "text-slate-500",
                )}
              />
              {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-slate-800 px-4 py-3">
          <p className="text-[9px] font-medium uppercase tracking-widest text-slate-700">
            © Horizon Platform
          </p>
        </div>
      )}
    </aside>
  );
}
