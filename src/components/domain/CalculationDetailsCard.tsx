"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/providers/LanguageProvider";

export function CalculationDetailsCard({
  activity,
  factor,
  formula,
  result,
  source,
  version,
}: {
  activity: string;
  factor: string;
  formula: string;
  result: string;
  source: string;
  version: string;
}) {
  const { locale } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{locale === "tr" ? "Hesaplama Detayları" : "Calculation Details"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p>{locale === "tr" ? "Aktivite Verisi" : "Activity Data"}: {activity}</p>
        <p>{locale === "tr" ? "Emisyon Katsayısı" : "Emission Factor"}: {factor}</p>
        <p>{locale === "tr" ? "Formül" : "Formula"}: {formula}</p>
        <p className="font-semibold">{locale === "tr" ? "Sonuç" : "Result"}: {result}</p>
        <p className="text-xs text-amber-700">{locale === "tr" ? "Katsayı Kaynağı" : "Factor Source"}: {source} ({version})</p>
      </CardContent>
    </Card>
  );
}
