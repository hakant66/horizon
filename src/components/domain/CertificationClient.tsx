"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/domain/DataTable";
import { useI18n } from "@/components/providers/LanguageProvider";

export function CertificationClient({
  reportingPeriodId,
  reports,
  submissions,
}: {
  reportingPeriodId: string;
  reports: Array<{ id: string; framework: string }>;
  submissions: Array<{ id: string; status: string; report: { framework: string } }>;
}) {
  const { locale } = useI18n();
  const [reportId, setReportId] = useState(reports[0]?.id || "");
  const [message, setMessage] = useState("");

  async function createSubmission() {
    const res = await fetch("/api/certification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, reportingPeriodId }),
    });
    setMessage(
      res.ok
        ? locale === "tr"
          ? "Başvuru oluşturuldu. Listeyi yenileyin."
          : "Submission created. Refresh list."
        : locale === "tr"
          ? "Başvuru oluşturma başarısız"
          : "Submission creation failed",
    );
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <div className="flex items-center gap-2">
        <select className="h-9 rounded-md border border-slate-300 px-3 text-sm" value={reportId} onChange={(e) => setReportId(e.target.value)}>
          {reports.map((report) => (
            <option key={report.id} value={report.id}>
              {report.framework}
            </option>
          ))}
        </select>
        <Button onClick={createSubmission}>{locale === "tr" ? "Başvuru Oluştur" : "Create Submission"}</Button>
      </div>

      <DataTable
        data={submissions}
        columns={[
          { key: "report", header: locale === "tr" ? "Rapor" : "Report", render: (row) => row.report.framework },
          { key: "status", header: locale === "tr" ? "Durum" : "Status", render: (row) => row.status },
          {
            key: "actions",
            header: locale === "tr" ? "İşlemler" : "Actions",
            render: (row) => (
              <Link className="text-sm font-medium text-blue-700" href={`/certification/${row.id}`}>
                {locale === "tr" ? "Aç" : "Open"}
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
