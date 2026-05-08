"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/providers/LanguageProvider";

type Scenario = {
  id: string;
  scenarioName: string;
  temperaturePathway: string;
  scenarioFramework?: string | null;
  estimatedRevenueImpactPercent?: string | null;
  estimatedCostImpact?: string | null;
  qualitativeImpact?: string | null;
  assumptions?: string | null;
  aiImpactSummary?: string | null;
};

type Risk = {
  id: string;
  name: string;
  type: string;
  probability: string;
  impact: string;
  probabilityScore?: number | null;
  impactScore?: number | null;
  riskScore?: number | null;
  timeHorizon?: string | null;
  status?: string | null;
  residualRisk?: string | null;
  regulatoryRef?: string | null;
  mitigationPlan?: string | null;
  notes?: string | null;
  financialImpactEstimate?: string | null;
  aiNarrative?: string | null;
  aiNarrativeAt?: string | null;
  facility?: { name: string } | null;
  ownerUser?: { name: string } | null;
  scenarios: Scenario[];
};

const PATHWAY_COLORS: Record<string, string> = {
  "1.5C": "bg-green-100 text-green-800 border-green-300",
  "2C":   "bg-amber-100 text-amber-800 border-amber-300",
  "4C":   "bg-red-100 text-red-800 border-red-300",
};

const RISK_TYPE_LABELS: Record<string, { tr: string; en: string }> = {
  PHYSICAL_ACUTE:           { tr: "Fiziksel Ani",              en: "Physical Acute" },
  PHYSICAL_CHRONIC:         { tr: "Fiziksel Kronik",           en: "Physical Chronic" },
  TRANSITION_POLICY_LEGAL:  { tr: "Geçiş — Politika/Hukuk",   en: "Transition — Policy/Legal" },
  TRANSITION_MARKET:        { tr: "Geçiş — Piyasa",            en: "Transition — Market" },
  TRANSITION_TECHNOLOGY:    { tr: "Geçiş — Teknoloji",         en: "Transition — Technology" },
  TRANSITION_REPUTATION:    { tr: "Geçiş — İtibar",            en: "Transition — Reputation" },
};

const STATUS_COLORS: Record<string, string> = {
  Open:        "bg-red-100 text-red-700",
  Mitigated:   "bg-green-100 text-green-700",
  Accepted:    "bg-blue-100 text-blue-700",
  Transferred: "bg-purple-100 text-purple-700",
};

function ScenarioBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.abs(value / max) * 100;
  const isNeg = value < 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 shrink-0 text-right text-slate-500">{label}</span>
      <div className="relative flex-1 h-4 bg-slate-100 rounded overflow-hidden">
        <div
          className={`absolute top-0 ${isNeg ? "right-0" : "left-0"} h-full rounded ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-16 shrink-0 font-medium tabular-nums ${isNeg ? "text-red-600" : "text-green-700"}`}>
        {value > 0 ? "+" : ""}{value.toFixed(1)}%
      </span>
    </div>
  );
}

export function RiskDetailDrawer({
  risk,
  onClose,
  onNarrativeUpdated,
}: {
  risk: Risk;
  onClose: () => void;
  onNarrativeUpdated?: (narrative: string) => void;
}) {
  const { locale } = useI18n();
  const tr = locale === "tr";
  const [tab, setTab] = useState<"overview" | "scenarios" | "narrative" | "suggest">("overview");
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrativeText, setNarrativeText] = useState(risk.aiNarrative ?? "");
  const [narrativeMsg, setNarrativeMsg] = useState("");
  const [scenarioSummaryLoading, setScenarioSummaryLoading] = useState(false);
  const [scenarioSummary, setScenarioSummary] = useState(
    risk.scenarios[0]?.aiImpactSummary ?? ""
  );
  const [scenarioMsg, setScenarioMsg] = useState("");

  const typeLabel = RISK_TYPE_LABELS[risk.type]?.[tr ? "tr" : "en"] ?? risk.type;
  const statusColor = STATUS_COLORS[risk.status ?? "Open"] ?? "bg-slate-100 text-slate-700";

  const maxRevImpact = Math.max(...risk.scenarios.map((s) => Math.abs(Number(s.estimatedRevenueImpactPercent ?? 0))));

  async function generateNarrative() {
    setNarrativeLoading(true);
    setNarrativeMsg("");
    try {
      const res = await fetch("/api/risks/ai-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskId: risk.id, locale }),
      });
      const data = await res.json() as { data?: { narrative?: string }; error?: string };
      if (res.ok && data.data?.narrative) {
        setNarrativeText(data.data.narrative);
        onNarrativeUpdated?.(data.data.narrative);
        setNarrativeMsg(tr ? `✓ Anlatı oluşturuldu (${data.data.narrative.length} karakter)` : `✓ Narrative generated (${data.data.narrative.length} chars)`);
      } else {
        setNarrativeMsg(`${tr ? "Hata" : "Error"}: ${data.error ?? "Unknown"}`);
      }
    } catch {
      setNarrativeMsg(tr ? "Bağlantı hatası. Ollama çalışıyor mu?" : "Connection error. Is Ollama running?");
    } finally {
      setNarrativeLoading(false);
    }
  }

  async function generateScenarioSummary() {
    setScenarioSummaryLoading(true);
    setScenarioMsg("");
    try {
      const res = await fetch("/api/scenarios/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ climateRiskId: risk.id, locale }),
      });
      const data = await res.json() as { data?: { summary?: string }; error?: string };
      if (res.ok && data.data?.summary) {
        setScenarioSummary(data.data.summary);
        setScenarioMsg(tr ? "✓ AI özeti oluşturuldu" : "✓ AI summary generated");
      } else {
        setScenarioMsg(`${tr ? "Hata" : "Error"}: ${data.error ?? "Unknown"}`);
      }
    } catch {
      setScenarioMsg(tr ? "Bağlantı hatası." : "Connection error.");
    } finally {
      setScenarioSummaryLoading(false);
    }
  }

  const tabs = [
    { key: "overview",  label: tr ? "Genel Bakış" : "Overview" },
    { key: "scenarios", label: tr ? "Senaryolar" : "Scenarios" },
    { key: "narrative", label: tr ? "AI Anlatı" : "AI Narrative" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <button className="absolute inset-0 bg-black/30" onClick={onClose} aria-label={tr ? "Kapat" : "Close"} />

      {/* Drawer — full screen on mobile, fixed-width panel on sm+ */}
      <div className="relative z-10 flex h-full w-full sm:max-w-xl flex-col bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                {risk.status ?? "Open"}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {typeLabel}
              </span>
              {risk.riskScore != null && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  risk.riskScore >= 16 ? "bg-red-100 text-red-800" :
                  risk.riskScore >= 9  ? "bg-amber-100 text-amber-800" :
                  "bg-green-100 text-green-800"
                }`}>
                  {tr ? "Skor" : "Score"}: {risk.riskScore}
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-slate-800">{risk.name}</h2>
            <p className="text-xs text-slate-500">
              {risk.facility?.name ?? (tr ? "Tüm Tesisler" : "All Facilities")}
              {risk.ownerUser ? ` • ${risk.ownerUser.name}` : ""}
              {risk.timeHorizon ? ` • ${risk.timeHorizon}` : ""}
            </p>
          </div>
          <button
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                tab === t.key
                  ? "border-b-2 border-blue-600 text-blue-700"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── Overview tab ── */}
          {tab === "overview" && (
            <>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">{tr ? "Olasılık" : "Probability"}</dt>
                  <dd className="font-medium">{risk.probability} {risk.probabilityScore != null ? `(${risk.probabilityScore}/5)` : ""}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">{tr ? "Etki" : "Impact"}</dt>
                  <dd className="font-medium">{risk.impact} {risk.impactScore != null ? `(${risk.impactScore}/5)` : ""}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">{tr ? "Finansal Etki Tahmini" : "Financial Impact Est."}</dt>
                  <dd className="font-medium">
                    {risk.financialImpactEstimate ? `$${Number(risk.financialImpactEstimate).toLocaleString()}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">{tr ? "Standart Referansı" : "Regulatory Ref."}</dt>
                  <dd className="font-medium text-xs">{risk.regulatoryRef ?? "—"}</dd>
                </div>
              </dl>

              {risk.mitigationPlan && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">{tr ? "Azaltım Planı" : "Mitigation Plan"}</p>
                  <p className="text-sm text-slate-700 rounded bg-slate-50 p-3 leading-relaxed">{risk.mitigationPlan}</p>
                </div>
              )}

              {risk.residualRisk && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">{tr ? "Artık Risk" : "Residual Risk"}</p>
                  <p className="text-sm text-slate-700 rounded bg-amber-50 p-3">{risk.residualRisk}</p>
                </div>
              )}

              {risk.notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">{tr ? "Notlar" : "Notes"}</p>
                  <p className="text-sm text-slate-600">{risk.notes}</p>
                </div>
              )}
            </>
          )}

          {/* ── Scenarios tab ── */}
          {tab === "scenarios" && (
            <>
              {risk.scenarios.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  {tr ? "Bu riske ait senaryo yok." : "No scenarios for this risk."}
                </p>
              ) : (
                <>
                  {/* Revenue impact bar chart */}
                  {risk.scenarios.some((s) => s.estimatedRevenueImpactPercent) && (
                    <div className="space-y-2 rounded bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-600">
                        {tr ? "Gelir Etkisi Karşılaştırması (%)" : "Revenue Impact Comparison (%)"}
                      </p>
                      {risk.scenarios.map((s) => (
                        <ScenarioBar
                          key={s.id}
                          label={s.temperaturePathway}
                          value={Number(s.estimatedRevenueImpactPercent ?? 0)}
                          max={maxRevImpact || 1}
                          color={
                            s.temperaturePathway === "1.5C" ? "bg-green-400" :
                            s.temperaturePathway === "2C"   ? "bg-amber-400" :
                            "bg-red-400"
                          }
                        />
                      ))}
                    </div>
                  )}

                  {/* Scenario cards */}
                  {risk.scenarios.map((s) => (
                    <div
                      key={s.id}
                      className={`rounded-lg border p-4 space-y-2 ${PATHWAY_COLORS[s.temperaturePathway] ?? "bg-slate-50 border-slate-200"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{s.scenarioName}</span>
                        <span className="text-xs rounded-full border px-2 py-0.5">{s.temperaturePathway}</span>
                      </div>
                      {s.scenarioFramework && (
                        <p className="text-xs opacity-70">{s.scenarioFramework}</p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="opacity-60">{tr ? "Gelir Etkisi:" : "Revenue Impact:"}</span>
                          <span className="ml-1 font-medium">
                            {s.estimatedRevenueImpactPercent ? `${Number(s.estimatedRevenueImpactPercent).toFixed(1)}%` : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="opacity-60">{tr ? "Maliyet Etkisi:" : "Cost Impact:"}</span>
                          <span className="ml-1 font-medium">
                            {s.estimatedCostImpact ? `$${Number(s.estimatedCostImpact).toLocaleString()}` : "—"}
                          </span>
                        </div>
                      </div>
                      {s.qualitativeImpact && (
                        <p className="text-xs opacity-80 italic">{s.qualitativeImpact}</p>
                      )}
                      {s.assumptions && (
                        <details className="text-xs opacity-70">
                          <summary className="cursor-pointer">{tr ? "Varsayımlar" : "Assumptions"}</summary>
                          <p className="mt-1">{s.assumptions}</p>
                        </details>
                      )}
                    </div>
                  ))}

                  {/* AI Summary */}
                  <div className="rounded border border-purple-200 bg-purple-50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-purple-700">
                        {tr ? "AI Senaryo Karşılaştırma Özeti" : "AI Scenario Comparative Summary"}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={generateScenarioSummary}
                        disabled={scenarioSummaryLoading}
                        className="text-xs"
                      >
                        {scenarioSummaryLoading ? (tr ? "Oluşturuluyor…" : "Generating…") : (tr ? "AI Özeti Oluştur" : "Generate AI Summary")}
                      </Button>
                    </div>
                    {scenarioMsg && <p className="text-xs text-purple-600">{scenarioMsg}</p>}
                    {scenarioSummary ? (
                      <p className="text-sm text-slate-700 leading-relaxed">{scenarioSummary}</p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        {tr ? "Senaryo özetini oluşturmak için butona basın." : "Press the button to generate a scenario summary."}
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── AI Narrative tab ── */}
          {tab === "narrative" && (
            <div className="space-y-3">
              <div className="rounded bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                {tr
                  ? "AI, bu riske ilişkin TCFD / IFRS S2 / ESRS E1 uyumlu üç paragraflık bir anlatı oluşturur. Anlatı veritabanına kaydedilir ve rapor bölümünde kullanılabilir."
                  : "AI generates a three-paragraph TCFD / IFRS S2 / ESRS E1 compliant narrative for this risk. The narrative is saved to the database and can be used in report sections."}
              </div>

              <div className="flex gap-2">
                <Button onClick={generateNarrative} disabled={narrativeLoading}>
                  {narrativeLoading ? (tr ? "Oluşturuluyor…" : "Generating…") : (tr ? "AI Anlatı Oluştur" : "Generate AI Narrative")}
                </Button>
                {risk.aiNarrativeAt && (
                  <span className="self-center text-xs text-slate-400">
                    {tr ? "Son güncelleme:" : "Last updated:"} {new Date(risk.aiNarrativeAt).toLocaleString()}
                  </span>
                )}
              </div>

              {narrativeMsg && (
                <p className={`text-sm ${narrativeMsg.startsWith("✓") ? "text-green-700" : "text-red-600"}`}>
                  {narrativeMsg}
                </p>
              )}

              <Textarea
                value={narrativeText}
                onChange={(e) => setNarrativeText(e.target.value)}
                rows={12}
                placeholder={tr ? "Anlatı burada görünecek…" : "Narrative will appear here…"}
                className="text-sm leading-relaxed"
              />

              {narrativeText && (
                <p className="text-xs text-slate-400">
                  {tr
                    ? "Not: Metin üzerinde düzenleme yapabilirsiniz, ancak kaydetmek için ayrı bir PATCH isteği gerekmektedir."
                    : "Note: You can edit the text above, but saving requires a separate PATCH request."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
