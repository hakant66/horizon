"use client";

import { Bell, Menu, X, ChevronDown } from "lucide-react";
import { signOut } from "next-auth/react";
import { useI18n } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";

export function TopBar({
  orgName,
  period,
  userName,
  onMenuToggle,
  menuOpen,
}: {
  orgName: string;
  period: string;
  userName: string;
  onMenuToggle: () => void;
  menuOpen: boolean;
}) {
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 md:px-4 gap-2">
      {/* Left: hamburger + brand */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuToggle}
          aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onMenuToggle}
          aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
          className="hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-slate-900 leading-none">Horizon</h1>
          <p className="hidden sm:block truncate text-xs text-slate-400 leading-none mt-0.5">{orgName}</p>
        </div>
      </div>

      {/* Center: period badge (hidden on very small screens) */}
      <div className="hidden sm:flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 font-medium shrink-0">
        <span className="truncate max-w-32">{period}</span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </div>

      {/* Right: locale toggle + bell + user */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Locale toggle — compact pill */}
        <button
          onClick={() => setLocale(locale === "tr" ? "en" : "tr")}
          className="hidden sm:flex h-7 items-center rounded-full border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          {locale.toUpperCase()}
        </button>

        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          aria-label={t("notifications")}
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* User avatar + sign out */}
        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 uppercase">
            {userName.charAt(0)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="h-7 px-2 text-xs"
          >
            {t("signOut")}
          </Button>
        </div>
      </div>
    </header>
  );
}
