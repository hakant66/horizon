"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/LanguageProvider";

export function SettingsClient() {
  const { locale } = useI18n();
  const tr = locale === "tr";
  const [overdueMsg, setOverdueMsg] = useState("");

  async function markOverdue() {
    setOverdueMsg(tr ? "İşleniyor…" : "Processing…");
    const res = await fetch("/api/tasks/mark-overdue", { method: "POST" });
    if (res.ok) {
      const data = await res.json() as { markedOverdue: number };
      setOverdueMsg(
        tr
          ? `${data.markedOverdue} görev gecikmiş olarak işaretlendi`
          : `${data.markedOverdue} task(s) marked overdue`,
      );
    } else {
      setOverdueMsg(tr ? "İşlem başarısız" : "Operation failed");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{tr ? "Uyumluluk Bildirimi" : "Compliance Notice"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>
            {tr
              ? "Bu platform yapılandırılmış sürdürülebilirlik raporlama desteği sunar. Nihai mevzuat uyumu ve belgelendirme kararları yetkin profesyonellerin incelemesini gerektirir."
              : "This platform provides structured sustainability reporting support. Final regulatory compliance and certification decisions require review by qualified professionals."}
          </p>
          <p>
            {tr
              ? "Gösterim amaçlı örnek emisyon katsayıları kullanılmaktadır; gerçek belgelendirme öncesinde doğrulanmış resmi kaynaklarla değiştirilmelidir."
              : "Placeholder emission factors are used for demonstration and must be replaced with verified official sources before real certification use."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tr ? "Yönetim İşlemleri" : "Admin Operations"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => void markOverdue()}>
              {tr ? "Gecikmiş Görevleri İşaretle" : "Mark Overdue Tasks"}
            </Button>
            {overdueMsg && <p className="text-sm text-slate-600">{overdueMsg}</p>}
          </div>
          <p className="text-xs text-slate-400">
            {tr
              ? "Son tarihi geçmiş ve hâlâ açık ya da devam eden görevleri otomatik olarak gecikmiş olarak işaretler. Yalnızca admin rolü kullanabilir."
              : "Automatically marks tasks past their due date that are still open or in progress as overdue. Admin only."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
