"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Menu, X, ChevronDown, Check, Globe } from "lucide-react";
import { signOut } from "next-auth/react";
import { useI18n } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  type: string;
  /** Prisma model: title String, body String? */
  title: string;
  body?: string | null;
  isRead: boolean;
  createdAt: string;
};

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
  const tr = locale === "tr";

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications?limit=20")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { notifications: Notification[]; unreadCount: number }) => {
        setNotifications(d.notifications ?? []);
        setUnreadCount(d.unreadCount ?? 0);
      })
      .catch((err: unknown) => console.warn("Notifications fetch failed:", err));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markAllRead() {
    const res = await fetch("/api/notifications", { method: "PUT" });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  }

  async function markOne(id: string) {
    const res = await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  }

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-13 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 gap-3">
      {/* Left */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuToggle}
          aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
        <div className="hidden sm:block h-4 w-px bg-slate-200" />
        <div className="min-w-0 hidden sm:block">
          <p className="truncate text-xs text-slate-500">{orgName}</p>
        </div>
      </div>

      {/* Center: period */}
      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 cursor-default">
        <span className="truncate max-w-40">{period || (tr ? "Dönem seçilmedi" : "No period selected")}</span>
        <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Locale toggle */}
        <button
          onClick={() => setLocale(locale === "tr" ? "en" : "tr")}
          className="hidden sm:flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          aria-label="Toggle language"
        >
          <Globe className="h-3 w-3 text-slate-400" />
          {locale.toUpperCase()}
        </button>

        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label={t("notifications")}
            aria-expanded={open}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div
              className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60"
              role="dialog"
              aria-modal="true"
              aria-label={tr ? "Bildirimler" : "Notifications"}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  {tr ? "Bildirimler" : "Notifications"}
                  {unreadCount > 0 && (
                    <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700 font-bold">
                      {unreadCount}
                    </span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => void markAllRead()}
                    className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Check className="h-3 w-3" />
                    {tr ? "Tümünü okundu işaretle" : "Mark all read"}
                  </button>
                )}
              </div>
              <ul className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <li className="px-4 py-6 text-center text-xs text-slate-400">
                    {tr ? "Bildirim yok" : "No notifications"}
                  </li>
                ) : (
                  notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 text-xs transition-colors ${n.isRead ? "bg-white" : "bg-blue-50/50"}`}
                    >
                      <div
                        className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.isRead ? "bg-transparent" : "bg-blue-500"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`leading-snug font-medium ${n.isRead ? "text-slate-500" : "text-slate-800"}`}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className={`leading-snug ${n.isRead ? "text-slate-400" : "text-slate-600"}`}>
                            {n.body}
                          </p>
                        )}
                        <p className="mt-0.5 text-slate-400">
                          {new Date(n.createdAt).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-GB")}
                        </p>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => void markOne(n.id)}
                          className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          aria-label={tr ? "Okundu işaretle" : "Mark as read"}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
            {initials}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="h-8 px-2.5 text-xs text-slate-600"
          >
            {t("signOut")}
          </Button>
        </div>
      </div>
    </header>
  );
}
