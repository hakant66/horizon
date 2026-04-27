"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/domain/DataTable";
import { MaterialityMatrix } from "@/components/domain/MaterialityMatrix";
import { StatusBadge } from "@/components/domain/StatusBadge";
import { useI18n } from "@/components/providers/LanguageProvider";

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
  const { locale } = useI18n();
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
    setMessage(
      responses.every((r) => r.ok)
        ? locale === "tr"
          ? "Değerlendirme kaydedildi"
          : "Assessment saved"
        : locale === "tr"
          ? "Bazı konular kaydedilemedi"
          : "Some topics failed to save",
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        {locale === "tr"
          ? "Önemlilik, işletme değerini veya paydaş etkisini etkileyebilecek sürdürülebilirlik konularını belirlemeye yardımcı olur."
          : "Materiality helps identify sustainability topics that may affect enterprise value or stakeholder impact."}
      </p>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <DataTable
        data={rows}
        columns={[
          { key: "topic", header: locale === "tr" ? "ESG Konusu" : "ESG Topic", render: (row) => row.name },
          {
            key: "financial",
            header: locale === "tr" ? "Finansal Etki" : "Financial Impact",
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
            header: locale === "tr" ? "Etki Şiddeti" : "Impact Severity",
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
            header: locale === "tr" ? "Olasılık" : "Likelihood",
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
            header: locale === "tr" ? "Paydaş Endişesi" : "Stakeholder Concern",
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
            header: locale === "tr" ? "Önemli" : "Material",
            render: (row) => <StatusBadge status={row.isMaterial ? (locale === "tr" ? "Önemli" : "Material") : locale === "tr" ? "Önemli Değil" : "Not Material"} />,
          },
        ]}
      />

      <Button onClick={saveAll}>{locale === "tr" ? "Değerlendirmeyi Kaydet" : "Save Assessment"}</Button>

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
