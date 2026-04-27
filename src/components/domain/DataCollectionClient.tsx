"use client";

import { useState } from "react";
import { MetricEntryStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/domain/DataTable";
import { EvidenceUploader } from "@/components/domain/EvidenceUploader";
import { StatusBadge } from "@/components/domain/StatusBadge";

type Entry = {
  id: string;
  facilityId: string;
  reportingPeriodId: string;
  metricDefinitionId: string;
  facility: { name: string };
  metricDefinition: { name: string; isRequired: boolean };
  value: string | null;
  unit: string;
  status: MetricEntryStatus;
  ownerUserId: string | null;
};

export function DataCollectionClient({ entries }: { entries: Entry[] }) {
  const [rows, setRows] = useState<Entry[]>(entries);
  const [message, setMessage] = useState("");

  async function updateEntry(row: Entry) {
    const res = await fetch("/api/metrics", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: row.id,
        facilityId: row.facilityId,
        reportingPeriodId: row.reportingPeriodId,
        metricDefinitionId: row.metricDefinitionId,
        value: row.value ? Number(row.value) : null,
        unit: row.unit,
        status: row.status,
        ownerUserId: row.ownerUserId,
      }),
    });
    setMessage(res.ok ? "Metric updated" : "Metric update failed");
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Evidence supports the reliability of reported data and is required for review and certification.
      </p>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <DataTable
        data={rows}
        columns={[
          { key: "facility", header: "Facility", render: (row) => row.facility.name },
          { key: "metric", header: "Metric", render: (row) => row.metricDefinition.name },
          {
            key: "value",
            header: "Value",
            render: (row) => (
              <Input
                value={row.value || ""}
                onChange={(e) =>
                  setRows((prev) => prev.map((entry) => (entry.id === row.id ? { ...entry, value: e.target.value } : entry)))
                }
              />
            ),
          },
          { key: "unit", header: "Unit", render: (row) => row.unit },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Select
                value={row.status}
                onChange={(value) =>
                  setRows((prev) => prev.map((entry) => (entry.id === row.id ? { ...entry, status: value as MetricEntryStatus } : entry)))
                }
                options={Object.values(MetricEntryStatus).map((s) => ({ label: s, value: s }))}
              />
            ),
          },
          { key: "statusLabel", header: "State", render: (row) => <StatusBadge status={row.status} /> },
          {
            key: "evidence",
            header: "Evidence",
            render: (row) => <EvidenceUploader linkedEntityType="METRIC_ENTRY" linkedEntityId={row.id} />,
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <Button size="sm" onClick={() => updateEntry(row)}>
                Save
              </Button>
            ),
          },
        ]}
      />

      <div className="flex gap-2">
        <Button variant="outline">Upload Excel (placeholder)</Button>
        <Button variant="outline">Validate Data (placeholder)</Button>
        <Button variant="outline">Assign Owners (placeholder)</Button>
      </div>
    </div>
  );
}
