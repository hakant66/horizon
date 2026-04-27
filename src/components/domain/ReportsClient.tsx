"use client";

import Link from "next/link";
import { ReportFramework } from "@prisma/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/domain/DataTable";
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
  const [framework, setFramework] = useState<ReportFramework>(ReportFramework.IFRS_S1);
  const [message, setMessage] = useState("");

  async function createReport() {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportingPeriodId, framework }),
    });
    setMessage(
      res.ok
        ? locale === "tr"
          ? "Rapor oluşturuldu. Listeyi yenileyin."
          : "Report created. Refresh list."
        : locale === "tr"
          ? "Rapor oluşturma başarısız"
          : "Report creation failed",
    );
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      <div className="flex items-center gap-2">
        <select
          value={framework}
          onChange={(e) => setFramework(e.target.value as ReportFramework)}
          className="h-9 rounded-md border border-slate-300 px-3 text-sm"
        >
          {Object.values(ReportFramework).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <Button onClick={createReport}>{locale === "tr" ? "Rapor Oluştur" : "Create Report"}</Button>
      </div>

      <DataTable
        data={reports}
        columns={[
          { key: "framework", header: locale === "tr" ? "Çerçeve" : "Framework", render: (row) => row.framework },
          { key: "status", header: locale === "tr" ? "Durum" : "Status", render: (row) => row.status },
          { key: "generatedAt", header: locale === "tr" ? "Oluşturulma" : "Generated", render: (row) => row.generatedAt || "-" },
          {
            key: "actions",
            header: locale === "tr" ? "İşlemler" : "Actions",
            render: (row) => (
              <Link className="text-sm font-medium text-blue-700" href={`/reports/${row.id}`}>
                {locale === "tr" ? "Aç" : "Open"}
              </Link>
            ),
          },
        ]}
      />

      <FrameworkChecklist
        framework={framework}
        checks={[
          { label: locale === "tr" ? "Yönetişim" : "Governance", complete: true },
          { label: locale === "tr" ? "Strateji" : "Strategy", complete: true },
          { label: locale === "tr" ? "Risk yönetimi" : "Risk management", complete: true },
          { label: locale === "tr" ? "Metrikler ve hedefler" : "Metrics and targets", complete: true },
        ]}
      />
    </div>
  );
}
