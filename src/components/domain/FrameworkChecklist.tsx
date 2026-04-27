"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/domain/StatusBadge";
import { useI18n } from "@/components/providers/LanguageProvider";

export function FrameworkChecklist({
  framework,
  checks,
}: {
  framework: string;
  checks: { label: string; complete: boolean }[];
}) {
  const { locale } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{framework} {locale === "tr" ? "Kontrol Listesi" : "Checklist"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center justify-between">
            <span className="text-sm text-slate-700">{check.label}</span>
            <StatusBadge status={check.complete ? (locale === "tr" ? "Tamam" : "Complete") : locale === "tr" ? "Beklemede" : "Pending"} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
