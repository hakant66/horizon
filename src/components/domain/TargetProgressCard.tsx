"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/domain/ProgressBar";
import { StatusBadge } from "@/components/domain/StatusBadge";
import { useI18n } from "@/components/providers/LanguageProvider";

export function TargetProgressCard({
  name,
  baseline,
  current,
  progress,
  status,
}: {
  name: string;
  baseline: string;
  current: string;
  progress: number;
  status: string;
}) {
  const { locale } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-700">{locale === "tr" ? "Baz Değer" : "Baseline"}: {baseline}</p>
        <p className="text-sm text-slate-700">{locale === "tr" ? "Mevcut" : "Current"}: {current}</p>
        <ProgressBar value={progress} />
        <StatusBadge status={status} />
      </CardContent>
    </Card>
  );
}
