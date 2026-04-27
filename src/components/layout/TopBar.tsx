"use client";

import { Bell } from "lucide-react";
import { signOut } from "next-auth/react";
import { useI18n } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export function TopBar({
  orgName,
  period,
  userName,
}: {
  orgName: string;
  period: string;
  userName: string;
}) {
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div>
        <h1 className="text-base font-semibold text-slate-900">Horizon Sustainability</h1>
        <p className="text-xs text-slate-500">{t("appTagline")}</p>
      </div>
      <div className="flex items-center gap-3">
        <Select options={[{ label: orgName, value: orgName }]} value={orgName} />
        <Select options={[{ label: period, value: period }]} value={period} />
        <Select
          value={locale}
          onChange={(value) => setLocale(value as "tr" | "en")}
          options={[
            { label: `${t("language")}: TR`, value: "tr" },
            { label: `${t("language")}: EN`, value: "en" },
          ]}
          className="w-[120px]"
        />
        <button className="rounded p-2 hover:bg-slate-100" aria-label={t("notifications")}>
          <Bell className="h-4 w-4" />
        </button>
        <div className="text-sm text-slate-600">{userName}</div>
        <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
          {t("signOut")}
        </Button>
      </div>
    </header>
  );
}
