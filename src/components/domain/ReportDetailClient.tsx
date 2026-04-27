"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/providers/LanguageProvider";

export function ReportDetailClient({
  report,
  reportingPeriodId,
}: {
  report: {
    id: string;
    framework: string;
    governanceText: string | null;
    strategyText: string | null;
    riskManagementText: string | null;
    metricsTargetsText: string | null;
    status: string;
  };
  reportingPeriodId: string;
}) {
  const { locale } = useI18n();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    governanceText: report.governanceText || "",
    strategyText: report.strategyText || "",
    riskManagementText: report.riskManagementText || "",
    metricsTargetsText: report.metricsTargetsText || "",
  });

  async function save() {
    const res = await fetch("/api/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: report.id, ...form }),
    });
    setMessage(res.ok ? (locale === "tr" ? "Rapor kaydedildi" : "Report saved") : locale === "tr" ? "Rapor kaydı başarısız" : "Report save failed");
  }

  async function generateDraft() {
    const res = await fetch("/api/reports/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: report.id }),
    });
    setMessage(
      res.ok
        ? locale === "tr"
          ? "Taslak oluşturuldu"
          : "Draft generated"
        : locale === "tr"
          ? "Taslak oluşturma başarısız"
          : "Draft generation failed",
    );
  }

  async function submitForCertification() {
    const create = await fetch("/api/certification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: report.id, reportingPeriodId, status: "DRAFT" }),
    });
    if (!create.ok) {
      setMessage(locale === "tr" ? "Belgelendirme başvurusu oluşturulamadı" : "Failed to create certification submission");
      return;
    }
    const submission = (await create.json()) as { id: string };
    const submit = await fetch("/api/certification/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: submission.id }),
    });
    setMessage(
      submit.ok
        ? locale === "tr"
          ? "Belgelendirme için gönderildi"
          : "Submitted for certification"
        : locale === "tr"
          ? "Gönderim başarısız"
          : "Submission failed",
    );
  }

  async function exportHtml() {
    const t = {
      report: locale === "tr" ? "Rapor" : "Report",
      governance: locale === "tr" ? "Yönetişim" : "Governance",
      strategy: locale === "tr" ? "Strateji" : "Strategy",
      risk: locale === "tr" ? "Risk yönetimi" : "Risk management",
      metrics: locale === "tr" ? "Metrikler ve hedefler" : "Metrics and targets",
    };
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${report.framework} ${t.report}</title></head><body><h1>${report.framework}</h1><h2>${t.governance}</h2><p>${form.governanceText}</p><h2>${t.strategy}</h2><p>${form.strategyText}</p><h2>${t.risk}</h2><p>${form.riskManagementText}</p><h2>${t.metrics}</h2><p>${form.metricsTargetsText}</p></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.framework}-${report.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      <p className="text-xs text-amber-700">
        {locale === "tr"
          ? "Bu platform yapılandırılmış sürdürülebilirlik raporlama desteği sunar. Nihai mevzuat uyumu ve belgelendirme kararları yetkin profesyonellerin incelemesini gerektirir."
          : "This platform provides structured sustainability reporting support. Final regulatory compliance and certification decisions require review by qualified professionals."}
      </p>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="text-sm font-medium">{locale === "tr" ? "Yönetişim" : "Governance"}</label>
        <Textarea value={form.governanceText} onChange={(e) => setForm((p) => ({ ...p, governanceText: e.target.value }))} />
        <label className="text-sm font-medium">{locale === "tr" ? "Strateji" : "Strategy"}</label>
        <Textarea value={form.strategyText} onChange={(e) => setForm((p) => ({ ...p, strategyText: e.target.value }))} />
        <label className="text-sm font-medium">{locale === "tr" ? "Risk Yönetimi" : "Risk Management"}</label>
        <Textarea
          value={form.riskManagementText}
          onChange={(e) => setForm((p) => ({ ...p, riskManagementText: e.target.value }))}
        />
        <label className="text-sm font-medium">{locale === "tr" ? "Metrikler ve Hedefler" : "Metrics & Targets"}</label>
        <Textarea
          value={form.metricsTargetsText}
          onChange={(e) => setForm((p) => ({ ...p, metricsTargetsText: e.target.value }))}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={save}>{locale === "tr" ? "Kaydet" : "Save"}</Button>
        <Button variant="outline" onClick={generateDraft}>
          {locale === "tr" ? "Taslak Oluştur" : "Generate Draft"}
        </Button>
        <Button variant="outline" onClick={exportHtml}>
          {locale === "tr" ? "HTML Dışa Aktar" : "Export HTML"}
        </Button>
        <Button onClick={submitForCertification}>{locale === "tr" ? "Belgelendirmeye Gönder" : "Submit for Certification"}</Button>
      </div>
    </div>
  );
}
