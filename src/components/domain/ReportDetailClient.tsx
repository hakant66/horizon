"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
    setMessage(res.ok ? "Report saved" : "Report save failed");
  }

  async function generateDraft() {
    const res = await fetch("/api/reports/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: report.id }),
    });
    setMessage(res.ok ? "Draft generated" : "Draft generation failed");
  }

  async function submitForCertification() {
    const create = await fetch("/api/certification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: report.id, reportingPeriodId, status: "DRAFT" }),
    });
    if (!create.ok) {
      setMessage("Failed to create certification submission");
      return;
    }
    const submission = (await create.json()) as { id: string };
    const submit = await fetch("/api/certification/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: submission.id }),
    });
    setMessage(submit.ok ? "Submitted for certification" : "Submission failed");
  }

  async function exportHtml() {
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${report.framework} Report</title></head><body><h1>${report.framework}</h1><h2>Governance</h2><p>${form.governanceText}</p><h2>Strategy</h2><p>${form.strategyText}</p><h2>Risk management</h2><p>${form.riskManagementText}</p><h2>Metrics and targets</h2><p>${form.metricsTargetsText}</p></body></html>`;
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
        This platform provides structured sustainability reporting support. Final regulatory compliance and certification
        decisions require review by qualified professionals.
      </p>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="text-sm font-medium">Governance</label>
        <Textarea value={form.governanceText} onChange={(e) => setForm((p) => ({ ...p, governanceText: e.target.value }))} />
        <label className="text-sm font-medium">Strategy</label>
        <Textarea value={form.strategyText} onChange={(e) => setForm((p) => ({ ...p, strategyText: e.target.value }))} />
        <label className="text-sm font-medium">Risk Management</label>
        <Textarea
          value={form.riskManagementText}
          onChange={(e) => setForm((p) => ({ ...p, riskManagementText: e.target.value }))}
        />
        <label className="text-sm font-medium">Metrics & Targets</label>
        <Textarea
          value={form.metricsTargetsText}
          onChange={(e) => setForm((p) => ({ ...p, metricsTargetsText: e.target.value }))}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={save}>Save</Button>
        <Button variant="outline" onClick={generateDraft}>
          Generate Draft
        </Button>
        <Button variant="outline" onClick={exportHtml}>
          Export HTML
        </Button>
        <Button onClick={submitForCertification}>Submit for Certification</Button>
      </div>
    </div>
  );
}
