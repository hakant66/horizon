"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/domain/StatusBadge";
import { useI18n } from "@/components/providers/LanguageProvider";

export function RiskCard({
  name,
  type,
  probability,
  impact,
  owner,
}: {
  name: string;
  type: string;
  probability: string;
  impact: string;
  owner?: string;
}) {
  const { locale } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p>{locale === "tr" ? "Tür" : "Type"}: {type}</p>
        <p>
          {locale === "tr" ? "Olasılık" : "Probability"}: <StatusBadge status={probability} />
        </p>
        <p>
          {locale === "tr" ? "Etki" : "Impact"}: <StatusBadge status={impact} />
        </p>
        <p>{locale === "tr" ? "Sorumlu" : "Owner"}: {owner || (locale === "tr" ? "Atanmadı" : "Unassigned")}</p>
      </CardContent>
    </Card>
  );
}
