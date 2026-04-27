"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/domain/DataTable";
import { TargetProgressCard } from "@/components/domain/TargetProgressCard";

export function TargetsClient({
  reportingPeriodId,
  metricDefinitions,
  targets,
}: {
  reportingPeriodId: string;
  metricDefinitions: Array<{ id: string; name: string }>;
  targets: Array<{
    id: string;
    name: string;
    baselineYear: number;
    baselineValue: string;
    targetYear: number;
    targetValue: string;
    currentValue: string;
    status: string;
    progress: number;
    metricDefinition: { name: string };
  }>;
}) {
  const [message, setMessage] = useState("");

  async function createTarget(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, reportingPeriodId }),
    });
    setMessage(res.ok ? "Target created. Refresh to see latest list." : "Target creation failed");
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <DataTable
        data={targets}
        columns={[
          { key: "name", header: "Target", render: (row) => row.name },
          { key: "metric", header: "Metric", render: (row) => row.metricDefinition.name },
          { key: "baseline", header: "Baseline", render: (row) => `${row.baselineYear} = ${row.baselineValue}` },
          { key: "target", header: "Target", render: (row) => `${row.targetYear} = ${row.targetValue}` },
          { key: "current", header: "Current", render: (row) => row.currentValue },
          { key: "progress", header: "Progress", render: (row) => `${row.progress.toFixed(1)}%` },
          { key: "status", header: "Status", render: (row) => row.status },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {targets.map((target) => (
          <TargetProgressCard
            key={target.id}
            name={target.name}
            baseline={`${target.baselineYear} = ${target.baselineValue}`}
            current={`${new Date().getFullYear()} = ${target.currentValue}`}
            progress={target.progress}
            status={target.status}
          />
        ))}
      </div>

      <form
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void createTarget(new FormData(e.currentTarget));
        }}
      >
        <h3 className="col-span-full text-sm font-semibold">Add Target</h3>
        <Input name="name" placeholder="Target name" required />
        <select name="metricDefinitionId" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          {metricDefinitions.map((metric) => (
            <option key={metric.id} value={metric.id}>
              {metric.name}
            </option>
          ))}
        </select>
        <Input type="number" name="baselineYear" placeholder="Baseline year" required />
        <Input type="number" step="0.0001" name="baselineValue" placeholder="Baseline value" required />
        <Input type="number" name="targetYear" placeholder="Target year" required />
        <Input type="number" step="0.0001" name="targetValue" placeholder="Target value" required />
        <Input type="number" step="0.0001" name="currentValue" placeholder="Current value" required />
        <Button type="submit">Create Target</Button>
      </form>
    </div>
  );
}
