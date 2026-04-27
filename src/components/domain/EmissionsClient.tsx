"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/domain/DataTable";
import { CalculationDetailsCard } from "@/components/domain/CalculationDetailsCard";
import { EvidenceUploader } from "@/components/domain/EvidenceUploader";
import { MetricCard } from "@/components/domain/MetricCard";

type Calc = {
  id: string;
  metricEntryId: string;
  activityValue: string;
  activityUnit: string;
  factorValue: string;
  resultTCO2e: string;
  calculationFormula: string;
  emissionFactor: { id: string; name: string; source: string; versionYear: number; scope: string };
  metricEntry: {
    metricDefinition: { name: string; code: string };
    facility: { name: string };
  };
};

type MetricSeed = {
  id: string;
  metricDefinition: { name: string };
  value: string | null;
};

export function EmissionsClient({ calculations, metricsForRecalc }: { calculations: Calc[]; metricsForRecalc: MetricSeed[] }) {
  const [selected, setSelected] = useState<Calc | null>(calculations[0] || null);
  const [metricId, setMetricId] = useState(metricsForRecalc[0]?.id || "");
  const [message, setMessage] = useState("");

  async function recalculate() {
    if (!metricId) return;
    const res = await fetch("/api/emissions/recalculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metricEntryId: metricId }),
    });
    setMessage(res.ok ? "Recalculation completed. Refresh page for latest results." : "Recalculation failed");
  }

  const total = calculations.reduce((sum, calc) => sum + Number(calc.resultTCO2e || 0), 0);
  const scope1 = calculations
    .filter((c) => c.emissionFactor.scope === "SCOPE_1")
    .reduce((sum, c) => sum + Number(c.resultTCO2e || 0), 0);
  const scope2 = calculations
    .filter((c) => c.emissionFactor.scope === "SCOPE_2")
    .reduce((sum, c) => sum + Number(c.resultTCO2e || 0), 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Scope 1 emissions are direct emissions from sources owned or controlled by the company. Scope 2 emissions are
        indirect emissions from purchased electricity, steam, heating, or cooling.
      </p>
      <p className="text-xs text-amber-700">Placeholder/demo factors are shown below and must be verified before production use.</p>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total Emissions" value={`${total.toFixed(2)} tCO2e`} />
        <MetricCard title="Scope 1" value={`${scope1.toFixed(2)} tCO2e`} />
        <MetricCard title="Scope 2" value={`${scope2.toFixed(2)} tCO2e`} />
      </div>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <div className="flex items-center gap-2">
        <select className="h-9 rounded-md border border-slate-300 px-3 text-sm" value={metricId} onChange={(e) => setMetricId(e.target.value)}>
          {metricsForRecalc.map((metric) => (
            <option key={metric.id} value={metric.id}>
              {metric.metricDefinition.name}
            </option>
          ))}
        </select>
        <Button onClick={recalculate}>Recalculate</Button>
      </div>

      <DataTable
        data={calculations}
        columns={[
          { key: "facility", header: "Facility", render: (row) => row.metricEntry.facility.name },
          { key: "metric", header: "Metric", render: (row) => row.metricEntry.metricDefinition.name },
          { key: "scope", header: "Scope", render: (row) => row.emissionFactor.scope },
          { key: "activity", header: "Activity", render: (row) => `${row.activityValue} ${row.activityUnit}` },
          { key: "factor", header: "Factor", render: (row) => row.factorValue },
          { key: "result", header: "Result", render: (row) => `${Number(row.resultTCO2e).toFixed(4)} tCO2e` },
          { key: "actions", header: "Action", render: (row) => <Button size="sm" onClick={() => setSelected(row)}>Show Details</Button> },
        ]}
      />

      {selected ? (
        <div className="grid gap-4 md:grid-cols-2">
          <CalculationDetailsCard
            activity={`${selected.activityValue} ${selected.activityUnit}`}
            factor={`${selected.factorValue}`}
            formula={selected.calculationFormula}
            result={`${selected.resultTCO2e} tCO2e`}
            source={selected.emissionFactor.source}
            version={String(selected.emissionFactor.versionYear)}
          />
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold">Attach Evidence</h3>
            <EvidenceUploader linkedEntityType="EMISSION_CALCULATION" linkedEntityId={selected.id} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
