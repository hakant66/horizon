"use client";

import { useState } from "react";
import { ClimateRiskType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/domain/DataTable";
import { RiskCard } from "@/components/domain/RiskCard";

export function RisksClient({
  reportingPeriodId,
  facilities,
  users,
  risks,
}: {
  reportingPeriodId: string;
  facilities: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string }>;
  risks: Array<{
    id: string;
    name: string;
    type: ClimateRiskType;
    probability: string;
    impact: string;
    facility?: { name: string } | null;
    ownerUser?: { name: string } | null;
    mitigationPlan: string | null;
    scenarios: Array<{ id: string; scenarioName: string; temperaturePathway: string; estimatedRevenueImpactPercent: string | null }>;
  }>;
}) {
  const [message, setMessage] = useState("");

  async function createRisk(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/risks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, reportingPeriodId }),
    });
    setMessage(res.ok ? "Risk created. Refresh to see latest list." : "Risk creation failed");
  }

  async function addScenario(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setMessage(res.ok ? "Scenario saved. Refresh to see latest list." : "Scenario save failed");
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <DataTable
        data={risks}
        columns={[
          { key: "name", header: "Risk", render: (row) => row.name },
          { key: "type", header: "Type", render: (row) => row.type },
          { key: "probability", header: "Probability", render: (row) => row.probability },
          { key: "impact", header: "Impact", render: (row) => row.impact },
          { key: "owner", header: "Owner", render: (row) => row.ownerUser?.name || "-" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {risks.map((risk) => (
          <RiskCard
            key={risk.id}
            name={risk.name}
            type={risk.type}
            probability={risk.probability}
            impact={risk.impact}
            owner={risk.ownerUser?.name || undefined}
          />
        ))}
      </div>

      <form
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void createRisk(new FormData(e.currentTarget));
        }}
      >
        <h3 className="col-span-full text-sm font-semibold">Add Climate Risk</h3>
        <Input name="name" placeholder="Risk name" required />
        <select name="type" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          {Object.values(ClimateRiskType).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <Input name="probability" placeholder="Probability (High/Medium/Low)" required />
        <Input name="impact" placeholder="Impact (High/Medium/Low)" required />
        <select name="facilityId" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">No facility</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <select name="ownerUserId" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">No owner</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <Input type="number" name="financialImpactEstimate" placeholder="Financial impact estimate" />
        <Textarea name="mitigationPlan" placeholder="Mitigation plan" />
        <Button type="submit">Add Risk</Button>
      </form>

      <form
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void addScenario(new FormData(e.currentTarget));
        }}
      >
        <h3 className="col-span-full text-sm font-semibold">Add Scenario Analysis</h3>
        <select name="climateRiskId" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          {risks.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <Input name="scenarioName" defaultValue="2C scenario" />
        <select name="temperaturePathway" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          <option value="1.5C">1.5C scenario</option>
          <option value="2C">2C scenario</option>
          <option value="4C">4C scenario</option>
        </select>
        <Input type="number" step="0.1" name="estimatedRevenueImpactPercent" placeholder="Revenue impact %" />
        <Input type="number" step="0.01" name="estimatedCostImpact" placeholder="Cost impact" />
        <Textarea name="qualitativeImpact" placeholder="Qualitative impact" />
        <Textarea name="assumptions" placeholder="Assumptions" />
        <Button type="submit">Save Scenario</Button>
      </form>
    </div>
  );
}
