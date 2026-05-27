"use client";

import Link from "next/link";
import { ReportFramework } from "@prisma/client";
import { useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/domain/StatusBadge";
import { FrameworkChecklist } from "@/components/domain/FrameworkChecklist";
import { useI18n } from "@/components/providers/LanguageProvider";

export function ReportsClient({
  reportingPeriodId,
  reports,
}: {
  reportingPeriodId: string;
  reports: Array<{ id: string; framework: ReportFramework; status: string; generatedAt: string | null }>;
}) {
  const { locale } = useI18n();
  const tr = locale === "tr";
  const [framework, setFramework] = useState<ReportFramework>(ReportFramework.IFRS_S1);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function createReport() {
    setLoading(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportingPeriodId, framework }),
    });
    setLoading(false);
    setMessage({
      ok: res.ok,
      text: res.ok
        ? (tr ? "Rapor oluşturuldu. Sayfayı yenileyin." : "Report created. Refresh to see it.")
        : (tr ? "Rapor oluşturma başarısız" : "Report creation failed"),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <select
          value={framework}
          onChange={(e) => setFramework(e.target.value as ReportFramework)}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          {Object.values(ReportFramework).map((f) => (
            <option key={f} value={f}>{f.replace(/_/g, " ")}</option>
          ))}
        </select>
        <Button onClick={() => void createReport()} disabled={loading} size="sm">
          <Plus className="h-3.5 w-3.5" />
          {loading ? (tr ? "Oluşturuluyor…" : "Creating…") : (tr ? "Rapor Oluştur" : "Create Report")}
        </Button>
        {message && (
          <p className={`text-xs font-medium ${message.ok ? "text-emerald-700" : "text-red-700"}`}>
            {message.text}
          </p>
        )}
      </div>

      {reports.length === 0 ? (
        <p className="text-sm text-slate-400">{tr ? "Henüz rapor yok." : "No reports yet."}</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr>
                {[tr ? "Çerçeve" : "Framework", tr ? "Durum" : "Status", tr ? "Oluşturulma" : "Generated", ""].map((h, i) => (
                  <th key={i} className="h-9 px-4 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.framework.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {row.generatedAt ? new Date(row.generatedAt).toLocaleDateString(tr ? "tr-TR" : "en-GB") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/reports/${row.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900">
                      {tr ? "Aç" : "Open"} <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FrameworkChecklist
        framework={framework}
        checks={[
          { label: tr ? "Yönetişim" : "Governance",                 complete: true },
          { label: tr ? "Strateji" : "Strategy",                    complete: true },
          { label: tr ? "Risk yönetimi" : "Risk management",        complete: true },
          { label: tr ? "Metrikler ve hedefler" : "Metrics & targets", complete: true },
        ]}
      />
    </div>
  );
}
