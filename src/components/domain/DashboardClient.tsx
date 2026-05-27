"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { MetricCard } from "@/components/domain/MetricCard";
import { ProgressBar } from "@/components/domain/ProgressBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/providers/LanguageProvider";

type ScopeCompleteness = {
  scope1: number;
  scope2: number;
  scope3: number;
  hasScope1Calculations: boolean;
  hasScope2Calculations: boolean;
  hasScope3Calculations: boolean;
};

type DashboardData = {
  readiness: number;
  missingDataAlerts: Array<{ metricName: string; facilityName: string }>;
  evidenceCoverage: number;
  totalEmissionsTCO2e: number;
  energyTotal: number;
  certCount: number;
  // Phase 2 completeness metrics
  fillRate: number;
  validatedRate: number;
  overdueTaskCount: number;
  unevidencedAnswerCount: number;
  criticalGapCount: number;
  scopeCompleteness: ScopeCompleteness;
};

type StageMap = Record<string, number>;

const STAGE_LABELS: Record<string, { en: string; tr: string }> = {
  DATA_ENTRY:           { en: "Data Entry",          tr: "Veri Girişi" },
  MANAGER_REVIEW:       { en: "Manager Review",       tr: "Yönetici İncelemesi" },
  HORIZON_REVIEW:       { en: "Horizon Review",       tr: "Horizon İncelemesi" },
  APPROVED:             { en: "Approved",             tr: "Onaylandı" },
  REVISION_REQUESTED:   { en: "Revision Requested",  tr: "Revizyon İstendi" },
};

export function DashboardClient({
  data,
  reportingPeriodName,
}: {
  data: DashboardData;
  reportingPeriodName?: string;
}) {
  const { locale } = useI18n();
  const tr = locale === "tr";

  const [stages, setStages] = useState<StageMap | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stages")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { metrics: StageMap; answers: StageMap }) => {
        const merged: StageMap = {};
        for (const key of Object.keys({ ...d.metrics, ...d.answers })) {
          merged[key] = (d.metrics[key] ?? 0) + (d.answers[key] ?? 0);
        }
        setStages(merged);
      })
      .catch((err: unknown) => console.warn("Stages fetch failed:", err));
  }, []);

  const readiness = data.readiness;

  return (
    <div className="space-y-6">
      {/* ── KPI Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={tr ? "Toplam Emisyon" : "Total Emissions"}
          value={`${data.totalEmissionsTCO2e.toFixed(1)} tCO₂e`}
          accent="amber"
        />
        <MetricCard
          title={tr ? "Enerji Tüketimi" : "Energy Consumption"}
          value={`${data.energyTotal.toFixed(0)}`}
          subtitle={tr ? "aktivite birimi" : "activity units"}
        />
        <MetricCard
          title={tr ? "Kanıt Kapsamı" : "Evidence Coverage"}
          value={`${data.evidenceCoverage.toFixed(1)}%`}
          accent={data.evidenceCoverage >= 80 ? "green" : data.evidenceCoverage >= 50 ? undefined : "red"}
        />
        <MetricCard
          title={tr ? "Belgelendirme" : "Certifications"}
          value={String(data.certCount)}
          subtitle={tr ? "aktif başvuru" : "active submissions"}
        />
      </div>

      {/* ── Phase 2: Completeness KPIs ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={tr ? "Doldurma Oranı" : "Fill Rate"}
          value={`${data.fillRate.toFixed(1)}%`}
          accent={data.fillRate >= 80 ? "green" : data.fillRate >= 50 ? undefined : "red"}
          subtitle={tr ? "soru yanıtlandı" : "questions answered"}
        />
        <MetricCard
          title={tr ? "Doğrulama Oranı" : "Validated Rate"}
          value={`${data.validatedRate.toFixed(1)}%`}
          accent={data.validatedRate >= 80 ? "green" : undefined}
          subtitle={tr ? "metrik doğrulandı" : "metrics validated"}
        />
        <MetricCard
          title={tr ? "Gecikmiş Görevler" : "Overdue Tasks"}
          value={String(data.overdueTaskCount)}
          accent={data.overdueTaskCount > 0 ? "red" : "green"}
          subtitle={tr ? "vade geçmiş" : "past due date"}
        />
        <MetricCard
          title={tr ? "Kanıtsız Yanıtlar" : "Unevidenced Answers"}
          value={String(data.unevidencedAnswerCount)}
          accent={data.unevidencedAnswerCount > 0 ? "amber" : "green"}
          subtitle={tr ? "belge eksik" : "missing documents"}
        />
      </div>

      {/* ── Scope Completeness ── */}
      {(data.scopeCompleteness.scope1 > 0 || data.scopeCompleteness.scope2 > 0 || data.scopeCompleteness.scope3 > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>{tr ? "Kapsam Tamamlanma Durumu" : "Scope Completeness"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {(["scope1", "scope2", "scope3"] as const).map((key) => {
                const pct = data.scopeCompleteness[key];
                const hasCalc = data.scopeCompleteness[`has${key.charAt(0).toUpperCase()}${key.slice(1)}Calculations` as keyof ScopeCompleteness] as boolean;
                return (
                  <div key={key} className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      {tr
                        ? key === "scope1" ? "Kapsam 1" : key === "scope2" ? "Kapsam 2" : "Kapsam 3"
                        : key === "scope1" ? "Scope 1" : key === "scope2" ? "Scope 2" : "Scope 3"}
                    </p>
                    <ProgressBar value={pct} showPercent />
                    {hasCalc && (
                      <p className="mt-1 text-[10px] text-emerald-600">{tr ? "Hesaplama mevcut" : "Calculated"}</p>
                    )}
                  </div>
                );
              })}
            </div>
            {data.criticalGapCount > 0 && (
              <p className="mt-3 text-xs text-red-700 font-medium">
                ⚠ {tr
                  ? `${data.criticalGapCount} zorunlu soru yanıtlanmadı`
                  : `${data.criticalGapCount} mandatory question${data.criticalGapCount > 1 ? "s" : ""} unanswered`}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Readiness ── */}
      <Card>
        <CardHeader>
          <CardTitle>{tr ? "Raporlama Hazırlık Düzeyi" : "Reporting Readiness"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar
            value={readiness}
            label={reportingPeriodName ?? (tr ? "Aktif dönem" : "Active period")}
          />
          <p className="mt-3 text-xs text-slate-500">
            {readiness < 50
              ? (tr ? "Kritik veri eksiklikleri mevcut — veri toplamayı önceliklendirin." : "Critical data gaps remain — prioritise data collection.")
              : readiness < 80
                ? (tr ? "İyi ilerleme, ancak bazı alanlar dikkat gerektiriyor." : "Good progress, but some areas require attention.")
                : (tr ? "Raporlamaya hazır durumda." : "Ready for reporting.")}
          </p>
        </CardContent>
      </Card>

      {/* ── Workflow + Alerts ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tr ? "Eksik Veri Uyarıları" : "Missing Data Alerts"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.missingDataAlerts.length === 0 ? (
              <p className="text-sm text-emerald-700 font-medium">
                {tr ? "Tüm zorunlu veriler girildi." : "All required data has been captured."}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {data.missingDataAlerts.slice(0, 8).map((alert) => (
                  <li
                    key={`${alert.metricName}-${alert.facilityName}`}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span>
                      <span className="font-medium">{alert.metricName}</span>
                      {" — "}
                      {alert.facilityName}
                    </span>
                  </li>
                ))}
                {data.missingDataAlerts.length > 8 && (
                  <li className="text-xs text-slate-400">
                    {tr
                      ? `+${data.missingDataAlerts.length - 8} daha fazla`
                      : `+${data.missingDataAlerts.length - 8} more`}
                  </li>
                )}
              </ul>
            )}
            <Link
              href="/data-collection"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
            >
              {tr ? "Veri Toplama" : "Open Data Collection"}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tr ? "İş Akışı Durumu" : "Workflow Status"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-500">{tr ? "Raporlama Dönemi" : "Reporting Period"}</span>
              <span className="font-semibold text-slate-800">
                {reportingPeriodName ?? (tr ? "Yapılandırılmadı" : "Not configured")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-500">{tr ? "Aktif Başvurular" : "Active Submissions"}</span>
              <span className="font-semibold text-slate-800">{data.certCount}</span>
            </div>
            <Link
              href="/certification"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
            >
              {tr ? "Belgelendirme Modülü" : "Open Certification"}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ── Approval Stage Breakdown ── */}
      {stages && (
        <Card>
          <CardHeader>
            <CardTitle>{tr ? "Onay Aşaması Dağılımı" : "Approval Stage Breakdown"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Object.entries(stages).map(([stage, count]) => {
                const label = tr ? STAGE_LABELS[stage]?.tr : STAGE_LABELS[stage]?.en;
                const isApproved = stage === "APPROVED";
                const isRevision = stage === "REVISION_REQUESTED";
                return (
                  <div
                    key={stage}
                    className={`rounded-xl border px-4 py-3 text-center ${
                      isApproved ? "border-emerald-200 bg-emerald-50" : isRevision ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className={`text-2xl font-bold ${isApproved ? "text-emerald-700" : isRevision ? "text-amber-700" : "text-slate-800"}`}>
                      {count}
                    </p>
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      {label ?? stage}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Disclaimer ── */}
      <p className="text-xs text-slate-400 leading-relaxed">
        {tr
          ? "Bu platform yapılandırılmış sürdürülebilirlik raporlama desteği sunar. Nihai mevzuat uyumu ve belgelendirme kararları yetkin profesyonellerin incelemesini gerektirir."
          : "This platform provides structured sustainability reporting support. Final regulatory compliance and certification decisions require review by qualified professionals."}
      </p>
    </div>
  );
}
