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
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  function updateScore(id: string, field: keyof Topic, rawValue: number) {
    // Clamp in JS — HTML min/max is advisory only and can be bypassed by typing.
    const value = Math.min(5, Math.max(1, Math.round(rawValue)));
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

  async function fillFromAI() {
    setAiLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/ai/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "materiality" }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setMessage(err.error ?? (tr ? "AI doldurulamadı" : "AI fill failed"));
        return;
      }
      type AiTopic = { name: string; financialImpactScore: number; impactSeverityScore: number; likelihoodScore: number; stakeholderConcernScore: number };
      const data = (await res.json()) as { topics: AiTopic[] };
      if (!data.topics?.length) {
        setMessage(tr ? "AI herhangi bir konu bulamadı." : "AI could not identify any topics.");
        return;
      }
      const clamp = (n: number) => Math.min(5, Math.max(1, Math.round(n)));
      const incoming: Topic[] = data.topics.map((t, i) => ({
        id: `ai-${i}`,
        name: t.name,
        financialImpactScore: clamp(t.financialImpactScore),
        impactSeverityScore: clamp(t.impactSeverityScore),
        likelihoodScore: clamp(t.likelihoodScore),
        stakeholderConcernScore: clamp(t.stakeholderConcernScore),
        isMaterial:
          clamp(t.financialImpactScore) >= 4 ||
          clamp(t.impactSeverityScore) >= 4 ||
          clamp(t.stakeholderConcernScore) >= 4,
      }));
      // Merge: update existing topics by name, add new ones
      setRows((prev) => {
        const updated = prev.map((row) => {
          const match = incoming.find((t) => t.name.toLowerCase() === row.name.toLowerCase());
          return match ? { ...row, ...match, id: row.id } : row;
        });
        const existingNames = new Set(prev.map((r) => r.name.toLowerCase()));
        const newTopics = incoming.filter((t) => !existingNames.has(t.name.toLowerCase()));
        return [...updated, ...newTopics];
      });
      setMessage(
        tr
          ? `AI ${data.topics.length} konu önerdi. Lütfen kontrol edip kaydedin.`
          : `AI suggested ${data.topics.length} topics. Please review and save.`,
      );
    } catch {
      setMessage(tr ? "AI servisine ulaşılamadı" : "Could not reach AI service");
    } finally {
      setAiLoading(false);
    }
  }

  async function saveAll() {
    if (saving) return;
    setSaving(true);
    setMessage("");
    try {
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
    } finally {
      setSaving(false);
    }
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

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={saveAll} disabled={saving}>
          {saving ? (tr ? "Kaydediliyor…" : "Saving…") : (tr ? "Değerlendirmeyi Kaydet" : "Save Assessment")}
        </Button>
        <Button variant="outline" onClick={() => void fillFromAI()} disabled={aiLoading}>
          {aiLoading ? (tr ? "Yükleniyor..." : "Loading...") : (tr ? "AI ile Doldur" : "Fill with AI")}
        </Button>
      </div>

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
