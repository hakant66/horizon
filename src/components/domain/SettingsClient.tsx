"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/providers/LanguageProvider";

export function SettingsClient() {
  const { locale } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{locale === "tr" ? "Uyumluluk Bildirimi" : "Compliance Notice"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-700">
        <p>
          {locale === "tr"
            ? "Bu platform yapılandırılmış sürdürülebilirlik raporlama desteği sunar. Nihai mevzuat uyumu ve belgelendirme kararları yetkin profesyonellerin incelemesini gerektirir."
            : "This platform provides structured sustainability reporting support. Final regulatory compliance and certification decisions require review by qualified professionals."}
        </p>
        <p>
          {locale === "tr"
            ? "Gösterim amaçlı örnek emisyon katsayıları kullanılmaktadır; gerçek belgelendirme öncesinde doğrulanmış resmi kaynaklarla değiştirilmelidir."
            : "Placeholder emission factors are used for demonstration and must be replaced with verified official sources before real certification use."}
        </p>
      </CardContent>
    </Card>
  );
}
