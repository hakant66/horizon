"use client";

import Link from "next/link";
import { MetricCard } from "@/components/domain/MetricCard";
import { ProgressBar } from "@/components/domain/ProgressBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/providers/LanguageProvider";

type DashboardData = {
  readiness: number;
  missingDataAlerts: Array<{ metricName: string; facilityName: string }>;
  evidenceCoverage: number;
  totalEmissionsTCO2e: number;
  energyTotal: number;
  certCount: number;
};

export function DashboardClient({ data, reportingPeriodName }: { data: DashboardData; reportingPeriodName?: string }) {
  const { locale } = useI18n();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{locale === "tr" ? "Raporlama Hazırlık Düzeyi" : "Reporting Readiness"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar value={data.readiness} label={`${data.readiness}% ${locale === "tr" ? "Tamamlandı" : "Complete"}`} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title={locale === "tr" ? "Toplam Emisyon" : "Total Emissions"} value={`${data.totalEmissionsTCO2e.toFixed(2)} tCO2e`} />
        <MetricCard title={locale === "tr" ? "Enerji Tüketimi" : "Energy Consumption"} value={`${data.energyTotal.toFixed(2)} (${locale === "tr" ? "aktivite birimi" : "activity units"})`} />
        <MetricCard title={locale === "tr" ? "Kanıt Kapsamı" : "Evidence Coverage"} value={`${data.evidenceCoverage.toFixed(1)}%`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{locale === "tr" ? "Eksik Veri Uyarıları" : "Missing Data Alerts"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {data.missingDataAlerts.length ? (
              data.missingDataAlerts.map((alert) => (
                <p key={`${alert.metricName}-${alert.facilityName}`}>
                  {locale === "tr"
                    ? `- ${alert.metricName}, ${alert.facilityName} için eksik`
                    : `- ${alert.metricName} missing for ${alert.facilityName}`}
                </p>
              ))
            ) : (
              <p>{locale === "tr" ? "Gerekli tüm veriler şu anda girildi." : "All required data currently captured."}</p>
            )}
            <Link className="text-sm font-medium text-blue-700" href="/data-collection">
              {locale === "tr" ? "Veri Toplamayı Aç" : "Open Data Collection"}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{locale === "tr" ? "İş Akışı Durumu" : "Workflow Status"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{locale === "tr" ? "Raporlama dönemi" : "Reporting period"}: {reportingPeriodName || (locale === "tr" ? "Yapılandırılmadı" : "Not configured")}</p>
            <p>{locale === "tr" ? "Devam eden belgelendirme başvuruları" : "Certification submissions in progress"}: {data.certCount}</p>
            <p>{locale === "tr" ? "İç inceleme son tarihi" : "Internal review due"}: 15 Dec</p>
            <p>{locale === "tr" ? "Belgelendirme gönderim son tarihi" : "Certification submission due"}: 31 Dec</p>
            <Link className="text-sm font-medium text-blue-700" href="/certification">
              {locale === "tr" ? "Belgelendirme Modülünü Aç" : "Open Certification Module"}
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4 text-xs text-amber-700">
          {locale === "tr"
            ? "Bu platform yapılandırılmış sürdürülebilirlik raporlama desteği sunar. Nihai mevzuat uyumu ve belgelendirme kararları yetkin profesyonellerin incelemesini gerektirir."
            : "This platform provides structured sustainability reporting support. Final regulatory compliance and certification decisions require review by qualified professionals."}
        </CardContent>
      </Card>
    </>
  );
}
