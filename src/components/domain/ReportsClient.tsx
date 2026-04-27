"use client";

import Link from "next/link";
import { ReportFramework } from "@prisma/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/domain/DataTable";
import { FrameworkChecklist } from "@/components/domain/FrameworkChecklist";

export function ReportsClient({
  reportingPeriodId,
  reports,
}: {
  reportingPeriodId: string;
  reports: Array<{ id: string; framework: ReportFramework; status: string; generatedAt: string | null }>;
}) {
  const [framework, setFramework] = useState<ReportFramework>(ReportFramework.IFRS_S1);
  const [message, setMessage] = useState("");

  async function createReport() {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportingPeriodId, framework }),
    });
    setMessage(res.ok ? "Report created. Refresh list." : "Report creation failed");
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
        <Button onClick={createReport}>Create Report</Button>
      </div>

      <DataTable
        data={reports}
        columns={[
          { key: "framework", header: "Framework", render: (row) => row.framework },
          { key: "status", header: "Status", render: (row) => row.status },
          { key: "generatedAt", header: "Generated", render: (row) => row.generatedAt || "-" },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <Link className="text-sm font-medium text-blue-700" href={`/reports/${row.id}`}>
                Open
              </Link>
            ),
          },
        ]}
      />

      <FrameworkChecklist
        framework={framework}
        checks={[
          { label: "Governance", complete: true },
          { label: "Strategy", complete: true },
          { label: "Risk management", complete: true },
          { label: "Metrics and targets", complete: true },
        ]}
      />
    </div>
  );
}
