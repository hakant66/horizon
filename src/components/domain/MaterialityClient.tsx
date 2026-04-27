"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/domain/DataTable";
import { MaterialityMatrix } from "@/components/domain/MaterialityMatrix";
import { StatusBadge } from "@/components/domain/StatusBadge";

type Topic = {
  id: string;
  name: string;
  financialImpactScore: number;
  impactSeverityScore: number;
  likelihoodScore: number;
  stakeholderConcernScore: number;
  isMaterial: boolean;
};

export function MaterialityClient({
  reportingPeriodId,
  topics,
}: {
  reportingPeriodId: string;
  topics: Topic[];
}) {
  const [rows, setRows] = useState<Topic[]>(topics);
  const [message, setMessage] = useState("");

  function updateScore(id: string, field: keyof Topic, value: number) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
              isMaterial:
                (field === "financialImpactScore" ? value : row.financialImpactScore) >= 4 ||
                (field === "impactSeverityScore" ? value : row.impactSeverityScore) >= 4 ||
                (field === "stakeholderConcernScore" ? value : row.stakeholderConcernScore) >= 4,
            }
          : row,
      ),
    );
  }

  async function saveAll() {
    const responses = await Promise.all(
      rows.map((row) =>
        fetch("/api/materiality", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportingPeriodId,
            name: row.name,
            category: "ESG",
            financialImpactScore: row.financialImpactScore,
            impactSeverityScore: row.impactSeverityScore,
            likelihoodScore: row.likelihoodScore,
            stakeholderConcernScore: row.stakeholderConcernScore,
          }),
        }),
      ),
    );
    setMessage(responses.every((r) => r.ok) ? "Assessment saved" : "Some topics failed to save");
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Materiality helps identify sustainability topics that may affect enterprise value or stakeholder impact.
      </p>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <DataTable
        data={rows}
        columns={[
          { key: "topic", header: "ESG Topic", render: (row) => row.name },
          {
            key: "financial",
            header: "Financial Impact",
            render: (row) => (
              <Input
                type="number"
                min={1}
                max={5}
                value={row.financialImpactScore}
                onChange={(e) => updateScore(row.id, "financialImpactScore", Number(e.target.value))}
              />
            ),
          },
          {
            key: "severity",
            header: "Impact Severity",
            render: (row) => (
              <Input
                type="number"
                min={1}
                max={5}
                value={row.impactSeverityScore}
                onChange={(e) => updateScore(row.id, "impactSeverityScore", Number(e.target.value))}
              />
            ),
          },
          {
            key: "likelihood",
            header: "Likelihood",
            render: (row) => (
              <Input
                type="number"
                min={1}
                max={5}
                value={row.likelihoodScore}
                onChange={(e) => updateScore(row.id, "likelihoodScore", Number(e.target.value))}
              />
            ),
          },
          {
            key: "stakeholder",
            header: "Stakeholder Concern",
            render: (row) => (
              <Input
                type="number"
                min={1}
                max={5}
                value={row.stakeholderConcernScore}
                onChange={(e) => updateScore(row.id, "stakeholderConcernScore", Number(e.target.value))}
              />
            ),
          },
          { key: "material", header: "Material", render: (row) => <StatusBadge status={row.isMaterial ? "Material" : "Not Material"} /> },
        ]}
      />

      <Button onClick={saveAll}>Save Assessment</Button>

      <MaterialityMatrix
        points={rows.map((row) => ({
          name: row.name,
          financialImpactScore: row.financialImpactScore,
          impactSeverityScore: row.impactSeverityScore,
        }))}
      />
    </div>
  );
}
