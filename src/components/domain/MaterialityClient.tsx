"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/domain/DataTable";
import { MaterialityMatrix } from "@/components/domain/MaterialityMatrix";
import { StatusBadge } from "@/components/domain/StatusBadge";
import { useI18n } from "@/components/providers/LanguageProvider";
import { ALL_SASB_SUBSECTORS } from "@/lib/sector-mappings";

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
  suggestedTopics = [],
  sasbSector,
}: {
  reportingPeriodId: string;
  topics: Topic[];
  suggestedTopics?: string[];
  sasbSector?: string | null;
}) {
  const { locale } = useI18n();
  const tr = locale === "tr";
  const [rows, setRows] = useState<Topic[]>(topics);
  const [message, setMessage] = useState("");

  const subsector = sasbSector ? ALL_SASB_SUBSECTORS.find((s) => s.sics === sasbSector) : null;

  // Topics that are suggested but not yet in rows
  const missingTopics = suggestedTopics.filter((t) => !rows.some((r) => r.name.toLowerCase() === t.toLowerCase()));

  function addSuggestedTopics() {
    const newRows: Topic[] = missingTopics.map((name) => ({
      id: `suggested-${name}`,
      name,
      financialImpactScore: 3,
      impactSeverityScore: 3,
      likelihoodScore: 3,
      stakeholderConcernScore: 3,
      isMaterial: false,
    }));
    setRows((prev) => [...prev, ...newRows]);
  }

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
    setMessage(
      responses.every((r) => r.ok)
        ? tr ? "Değerlendirme kaydedildi" : "Assessment saved"
        : tr ? "Bazı konular kaydedilemedi" : "Some topics failed to save",
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        {tr
          ? "Önemlilik, işletme değerini veya paydaş etkisini etkileyebilecek sürdürülebilirlik konularını belirlemeye yardımcı olur."
          : "Materiality helps identify sustainability topics that may affect enterprise value or stakeholder impact."}
      </p>

      {/* Sector-based suggested topics banner */}
      {subsector && missingTopics.length > 0 && (
        <div className="flex items-start justify-between gap-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-blue-800">
              {tr
                ? `${subsector.label_tr} (${subsector.sics}) sektörü için önerilen konular`
                : `Suggested topics for ${subsector.label_en} (${subsector.sics}) sector`}
            </p>
            <p className="mt-0.5 text-xs text-blue-600">{missingTopics.join(" · ")}</p>
          </div>
          <Button size="sm" onClick={addSuggestedTopics}>
            {tr ? "Tümünü Ekle" : "Add All"}
          </Button>
        </div>
      )}

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <DataTable
        data={rows}
        columns={[
          { key: "topic", header: tr ? "ESG Konusu" : "ESG Topic", render: (row) => row.name },
          {
            key: "financial",
            header: tr ? "Finansal Etki" : "Financial Impact",
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
            header: tr ? "Etki Şiddeti" : "Impact Severity",
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
            header: tr ? "Olasılık" : "Likelihood",
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
            header: tr ? "Paydaş Endişesi" : "Stakeholder Concern",
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
          {
            key: "material",
            header: tr ? "Önemli" : "Material",
            render: (row) => <StatusBadge status={row.isMaterial ? (tr ? "Önemli" : "Material") : tr ? "Önemli Değil" : "Not Material"} />,
          },
        ]}
      />

      <Button onClick={saveAll}>{tr ? "Değerlendirmeyi Kaydet" : "Save Assessment"}</Button>

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
