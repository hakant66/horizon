"use client";

import { useState } from "react";
import { ClimateRiskType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskHeatMap } from "@/components/domain/RiskHeatMap";
import { RiskDetailDrawer } from "@/components/domain/RiskDetailDrawer";
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
  type: ClimateRiskType;
  probability: string;
  impact: string;
  probabilityScore?: number | null;
  impactScore?: number | null;
  riskScore?: number | null;
  timeHorizon?: string | null;
  status?: string | null;
  residualRisk?: string | null;
  regulatoryRef?: string | null;
  financialImpactEstimate?: string | null;
  mitigationPlan?: string | null;
  notes?: string | null;
  aiNarrative?: string | null;
  aiNarrativeAt?: string | null;
  facility?: { name: string } | null;
  ownerUser?: { name: string } | null;
  scenarios: Scenario[];
};

interface AiSuggestion {
  name: string;
  type: string;
  probability: string;
  impact: string;
  timeHorizon: string;
  rationale: string;
}

const RISK_TYPE_LABELS: Record<string, { tr: string; en: string }> = {
  PHYSICAL_ACUTE:           { tr: "Fiziksel Ani",            en: "Physical Acute" },
  PHYSICAL_CHRONIC:         { tr: "Fiziksel Kronik",         en: "Physical Chronic" },
  TRANSITION_POLICY_LEGAL:  { tr: "Geçiş — Politika/Hukuk", en: "Transition — Policy/Legal" },
  TRANSITION_MARKET:        { tr: "Geçiş — Piyasa",          en: "Transition — Market" },
  TRANSITION_TECHNOLOGY:    { tr: "Geçiş — Teknoloji",       en: "Transition — Technology" },
  TRANSITION_REPUTATION:    { tr: "Geçiş — İtibar",          en: "Transition — Reputation" },
};

const STATUS_COLORS: Record<string, string> = {
  Open:        "bg-red-100 text-red-700",
  Mitigated:   "bg-green-100 text-green-700",
  Accepted:    "bg-blue-100 text-blue-700",
  Transferred: "bg-purple-100 text-purple-700",
};

function probabilityToScore(p: string) {
  return p === "High" ? 4 : p === "Medium" ? 2 : 1;
}

export function RisksClient({
  reportingPeriodId,
  facilities,
  users,
  risks: initialRisks,
}: {
  reportingPeriodId: string;
  facilities: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string }>;
  risks: Risk[];
}) {
  const { locale } = useI18n();
  const tr = locale === "tr";

  const [risks, setRisks] = useState<Risk[]>(initialRisks);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [tab, setTab] = useState<"list" | "heatmap" | "add-risk" | "add-scenario" | "ai-suggest">("list");
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false);
  const [aiSuggestMsg, setAiSuggestMsg] = useState("");

  // ── Stats ──────────────────────────────────────────────────────────────────
  const openRisks     = risks.filter((r) => (r.status ?? "Open") === "Open").length;
  const criticalRisks = risks.filter((r) => (r.riskScore ?? 0) >= 16).length;
  const avgScore      = risks.length > 0
    ? (risks.reduce((s, r) => s + (r.riskScore ?? 0), 0) / risks.length).toFixed(1)
    : "—";

  // ── Form submit: create risk ───────────────────────────────────────────────
  async function createRisk(formData: FormData) {
    const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
    const probScore = probabilityToScore(raw.probability);
    const impScore  = probabilityToScore(raw.impact);

    const payload = {
      ...raw,
      reportingPeriodId,
      probabilityScore: probScore,
      impactScore: impScore,
      financialImpactEstimate: raw.financialImpactEstimate ? Number(raw.financialImpactEstimate) : null,
    };

    const res = await fetch("/api/risks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = (await res.json()) as { data: Risk };
      setRisks((prev) => [{ ...data.data, scenarios: [] }, ...prev]);
      setMessage({ ok: true, text: tr ? "Risk oluşturuldu." : "Risk created." });
      setTab("list");
    } else {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage({ ok: false, text: err.error ?? (tr ? "Hata" : "Error") });
    }
  }

  // ── Form submit: add scenario ──────────────────────────────────────────────
  async function addScenario(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = (await res.json()) as { data: Scenario & { climateRiskId: string } };
      setRisks((prev) =>
        prev.map((r) =>
          r.id === data.data.climateRiskId
            ? { ...r, scenarios: [...r.scenarios, data.data] }
            : r
        )
      );
      setMessage({ ok: true, text: tr ? "Senaryo kaydedildi." : "Scenario saved." });
      setTab("list");
    } else {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage({ ok: false, text: err.error ?? (tr ? "Hata" : "Error") });
    }
  }

  // ── Delete risk ─────────────────────────────────────────────────────────────
  async function deleteRisk(id: string) {
    if (!confirm(tr ? "Bu riski silmek istediğinize emin misiniz?" : "Are you sure you want to delete this risk?")) return;
    const res = await fetch("/api/risks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setRisks((prev) => prev.filter((r) => r.id !== id));
      if (selectedRisk?.id === id) setSelectedRisk(null);
    }
  }

  // ── AI Suggest ─────────────────────────────────────────────────────────────
  async function fetchAiSuggestions() {
    setAiSuggestLoading(true);
    setAiSuggestMsg("");
    try {
      const res = await fetch("/api/risks/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportingPeriodId, locale }),
      });
      const data = (await res.json()) as { data?: { suggestions?: AiSuggestion[]; rawContent?: string }; error?: string };
      if (res.ok && data.data?.suggestions && data.data.suggestions.length > 0) {
        setAiSuggestions(data.data.suggestions);
        setAiSuggestMsg(tr ? `${data.data.suggestions.length} öneri oluşturuldu.` : `${data.data.suggestions.length} suggestions generated.`);
      } else {
        setAiSuggestMsg(tr ? "Öneri üretilemedi. Ollama çalışıyor mu?" : "Could not generate suggestions. Is Ollama running?");
      }
    } catch {
      setAiSuggestMsg(tr ? "Bağlantı hatası." : "Connection error.");
    } finally {
      setAiSuggestLoading(false);
    }
  }

  async function acceptSuggestion(s: AiSuggestion) {
    const payload = {
      reportingPeriodId,
      name: s.name,
      type: s.type,
      probability: s.probability as "High" | "Medium" | "Low",
      impact: s.impact as "High" | "Medium" | "Low",
      timeHorizon: s.timeHorizon,
      notes: s.rationale,
    };
    const res = await fetch("/api/risks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = (await res.json()) as { data: Risk };
      setRisks((prev) => [{ ...data.data, scenarios: [] }, ...prev]);
      setAiSuggestions((prev) => prev.filter((x) => x.name !== s.name));
    }
  }

  const mainTabs = [
    { key: "list",      label: tr ? "Risk Listesi" : "Risk List" },
    { key: "heatmap",   label: tr ? "Isı Haritası" : "Heat Map" },
    { key: "add-risk",  label: tr ? "+ Risk Ekle" : "+ Add Risk" },
    { key: "add-scenario", label: tr ? "+ Senaryo" : "+ Scenario" },
    { key: "ai-suggest", label: tr ? "🤖 AI Önerileri" : "🤖 AI Suggest" },
  ] as const;

  return (
    <div className="space-y-5">
      {/* ── Dashboard summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-500">{tr ? "Toplam Risk" : "Total Risks"}</p>
            <p className="text-3xl font-bold text-slate-800">{risks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-500">{tr ? "Açık Risk" : "Open Risks"}</p>
            <p className="text-3xl font-bold text-red-600">{openRisks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-500">{tr ? "Kritik (≥16) / Ort. Skor" : "Critical (≥16) / Avg Score"}</p>
            <p className="text-3xl font-bold text-amber-600">{criticalRisks} <span className="text-base text-slate-400">/ {avgScore}</span></p>
          </CardContent>
        </Card>
      </div>

      {/* ── Messages ── */}
      {message && (
        <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>
      )}

      {/* ── Tab bar ── */}
      <div className="flex gap-1 flex-wrap border-b border-slate-200">
        {mainTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t ${
              tab === t.key
                ? "bg-white border border-b-white border-slate-200 text-blue-700 -mb-px"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── List tab ── */}
      {tab === "list" && (
        <div className="space-y-2">
          {risks.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              {tr ? "Henüz risk kaydı yok. 'Risk Ekle' sekmesinden başlayın." : "No risks yet. Start from the 'Add Risk' tab."}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">{tr ? "Risk" : "Risk"}</th>
                    <th className="px-3 py-2 text-left">{tr ? "Tür" : "Type"}</th>
                    <th className="px-3 py-2 text-center">{tr ? "Olasılık" : "Prob."}</th>
                    <th className="px-3 py-2 text-center">{tr ? "Etki" : "Impact"}</th>
                    <th className="px-3 py-2 text-center">{tr ? "Skor" : "Score"}</th>
                    <th className="px-3 py-2 text-left">{tr ? "Durum" : "Status"}</th>
                    <th className="px-3 py-2 text-left">{tr ? "Sorumlu" : "Owner"}</th>
                    <th className="px-3 py-2 text-center">{tr ? "Senaryo" : "Scenarios"}</th>
                    <th className="px-3 py-2 text-center">AI</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {risks.map((r) => {
                    const score = r.riskScore ?? 0;
                    const scoreBg = score >= 16 ? "bg-red-100 text-red-700" : score >= 9 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-800 max-w-48 truncate">{r.name}</td>
                        <td className="px-3 py-2 text-slate-500 text-xs">{RISK_TYPE_LABELS[r.type]?.[tr ? "tr" : "en"] ?? r.type}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-xs font-medium ${r.probability === "High" ? "text-red-600" : r.probability === "Medium" ? "text-amber-600" : "text-green-600"}`}>
                            {r.probability}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-xs font-medium ${r.impact === "High" ? "text-red-600" : r.impact === "Medium" ? "text-amber-600" : "text-green-600"}`}>
                            {r.impact}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${scoreBg}`}>
                            {score || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[r.status ?? "Open"] ?? ""}`}>
                            {r.status ?? "Open"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-xs">{r.ownerUser?.name ?? "—"}</td>
                        <td className="px-3 py-2 text-center text-xs text-slate-400">{r.scenarios.length}</td>
                        <td className="px-3 py-2 text-center">
                          {r.aiNarrative ? (
                            <span className="text-green-500 text-xs" title={tr ? "AI anlatı mevcut" : "AI narrative exists"}>✓</span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => setSelectedRisk(r)}>
                              {tr ? "Detay" : "Detail"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => deleteRisk(r.id)} className="text-red-500 hover:text-red-700">
                              ✕
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Heat map tab ── */}
      {tab === "heatmap" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{tr ? "Risk Isı Haritası" : "Risk Heat Map"}</CardTitle>
          </CardHeader>
          <CardContent>
            {risks.filter((r) => r.probabilityScore && r.impactScore).length === 0 ? (
              <p className="text-sm text-slate-400">
                {tr ? "Isı haritası için risklerinizin Olasılık Skoru ve Etki Skoru değerlerine sahip olması gerekir." : "Risks need probabilityScore and impactScore values to appear on the heat map."}
              </p>
            ) : (
              <RiskHeatMap
                risks={risks
                  .filter((r) => r.probabilityScore && r.impactScore)
                  .map((r) => ({
                    id: r.id,
                    name: r.name,
                    probabilityScore: r.probabilityScore!,
                    impactScore: r.impactScore!,
                    status: r.status ?? "Open",
                  }))}
                onSelect={(id) => {
                  const found = risks.find((r) => r.id === id);
                  if (found) setSelectedRisk(found);
                }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Add risk tab ── */}
      {tab === "add-risk" && (
        <form
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void createRisk(new FormData(e.currentTarget));
          }}
        >
          <h3 className="font-semibold text-slate-700">{tr ? "İklim Riski Ekle" : "Add Climate Risk"}</h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="col-span-full">
              <label className="text-xs text-slate-600">{tr ? "Risk Adı *" : "Risk Name *"}</label>
              <Input name="name" placeholder={tr ? "Risk adı" : "Risk name"} required />
            </div>

            <div>
              <label className="text-xs text-slate-600">{tr ? "Risk Türü *" : "Risk Type *"}</label>
              <select name="type" className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm">
                {Object.values(ClimateRiskType).map((type) => (
                  <option key={type} value={type}>
                    {RISK_TYPE_LABELS[type]?.[tr ? "tr" : "en"] ?? type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600">{tr ? "Zaman Ufku" : "Time Horizon"}</label>
              <select name="timeHorizon" className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm">
                <option value="">{tr ? "Seçiniz" : "Select"}</option>
                <option value="Short-term">{tr ? "Kısa vadeli" : "Short-term"}</option>
                <option value="Medium-term">{tr ? "Orta vadeli" : "Medium-term"}</option>
                <option value="Long-term">{tr ? "Uzun vadeli" : "Long-term"}</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600">{tr ? "Olasılık *" : "Probability *"}</label>
              <select name="probability" className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm" required>
                <option value="High">{tr ? "Yüksek" : "High"}</option>
                <option value="Medium">{tr ? "Orta" : "Medium"}</option>
                <option value="Low">{tr ? "Düşük" : "Low"}</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600">{tr ? "Etki *" : "Impact *"}</label>
              <select name="impact" className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm" required>
                <option value="High">{tr ? "Yüksek" : "High"}</option>
                <option value="Medium">{tr ? "Orta" : "Medium"}</option>
                <option value="Low">{tr ? "Düşük" : "Low"}</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600">{tr ? "Durum" : "Status"}</label>
              <select name="status" className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm">
                <option value="Open">Open</option>
                <option value="Mitigated">Mitigated</option>
                <option value="Accepted">Accepted</option>
                <option value="Transferred">Transferred</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600">{tr ? "Tesis" : "Facility"}</label>
              <select name="facilityId" className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm">
                <option value="">{tr ? "Tesis yok" : "No facility"}</option>
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600">{tr ? "Sorumlu" : "Owner"}</label>
              <select name="ownerUserId" className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm">
                <option value="">{tr ? "Sorumlu yok" : "No owner"}</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600">{tr ? "Finansal Etki Tahmini (USD)" : "Financial Impact Estimate (USD)"}</label>
              <Input type="number" name="financialImpactEstimate" placeholder="0" />
            </div>

            <div>
              <label className="text-xs text-slate-600">{tr ? "Standart Referansı" : "Regulatory Reference"}</label>
              <Input name="regulatoryRef" placeholder="TCFD / IFRS S2 Para. 16" />
            </div>

            <div className="col-span-full">
              <label className="text-xs text-slate-600">{tr ? "Azaltım Planı" : "Mitigation Plan"}</label>
              <Textarea name="mitigationPlan" rows={3} placeholder={tr ? "Azaltım tedbirleri…" : "Mitigation measures…"} />
            </div>

            <div className="col-span-full">
              <label className="text-xs text-slate-600">{tr ? "Artık Risk" : "Residual Risk"}</label>
              <Input name="residualRisk" placeholder={tr ? "Azaltım sonrası kalan risk" : "Risk remaining after mitigation"} />
            </div>

            <div className="col-span-full">
              <label className="text-xs text-slate-600">{tr ? "Notlar" : "Notes"}</label>
              <Textarea name="notes" rows={2} placeholder={tr ? "Ek notlar…" : "Additional notes…"} />
            </div>
          </div>

          <Button type="submit">{tr ? "Risk Ekle" : "Add Risk"}</Button>
        </form>
      )}

      {/* ── Add scenario tab ── */}
      {tab === "add-scenario" && (
        <form
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void addScenario(new FormData(e.currentTarget));
          }}
        >
          <h3 className="font-semibold text-slate-700">{tr ? "Senaryo Analizi Ekle" : "Add Scenario Analysis"}</h3>
          {risks.length === 0 && (
            <p className="text-sm text-amber-600">{tr ? "Önce bir risk ekleyin." : "Add a risk first."}</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-600">{tr ? "Risk *" : "Risk *"}</label>
              <select name="climateRiskId" className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm" required>
                {risks.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600">{tr ? "Senaryo Adı" : "Scenario Name"}</label>
              <Input name="scenarioName" defaultValue={tr ? "2C senaryosu" : "2C scenario"} />
            </div>

            <div>
              <label className="text-xs text-slate-600">{tr ? "Sıcaklık Yolu *" : "Temperature Pathway *"}</label>
              <select name="temperaturePathway" className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm">
                <option value="1.5C">1.5°C (Paris Aligned)</option>
                <option value="2C">2°C (Moderate Transition)</option>
                <option value="4C">4°C (High Warming)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600">{tr ? "Senaryo Çerçevesi" : "Scenario Framework"}</label>
              <select name="scenarioFramework" className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm">
                <option value="">{tr ? "Seçiniz" : "Select"}</option>
                <option value="NGFS">NGFS</option>
                <option value="IEA NZE">IEA NZE</option>
                <option value="IPCC SSP">IPCC SSP</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600">{tr ? "Gelir Etkisi (%)" : "Revenue Impact (%)"}</label>
              <Input type="number" step="0.1" name="estimatedRevenueImpactPercent" placeholder="e.g. -5.2" />
            </div>

            <div>
              <label className="text-xs text-slate-600">{tr ? "Maliyet Etkisi (USD)" : "Cost Impact (USD)"}</label>
              <Input type="number" step="0.01" name="estimatedCostImpact" placeholder="e.g. 50000" />
            </div>

            <div>
              <label className="text-xs text-slate-600">{tr ? "Güven Düzeyi" : "Confidence Level"}</label>
              <select name="confidenceLevel" className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm">
                <option value="">{tr ? "Seçiniz" : "Select"}</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600">{tr ? "Fiziksel Tehlike" : "Physical Hazard"}</label>
              <Input name="physicalHazard" placeholder={tr ? "örn: Sel, Kuraklık, Isı stresi" : "e.g. Flood, Drought, Heat stress"} />
            </div>

            <div className="col-span-full">
              <label className="text-xs text-slate-600">{tr ? "Nitel Etki" : "Qualitative Impact"}</label>
              <Textarea name="qualitativeImpact" rows={2} placeholder={tr ? "Senaryo altında beklenen etkiler…" : "Expected impacts under this scenario…"} />
            </div>

            <div className="col-span-full">
              <label className="text-xs text-slate-600">{tr ? "Uyum Önlemleri" : "Adaptation Measures"}</label>
              <Textarea name="adaptationMeasure" rows={2} placeholder={tr ? "Alınan veya planlanan uyum önlemleri…" : "Adaptation measures taken or planned…"} />
            </div>

            <div className="col-span-full">
              <label className="text-xs text-slate-600">{tr ? "Varsayımlar" : "Assumptions"}</label>
              <Textarea name="assumptions" rows={2} placeholder={tr ? "Senaryo varsayımları…" : "Scenario assumptions…"} />
            </div>
          </div>

          <Button type="submit">{tr ? "Senaryo Kaydet" : "Save Scenario"}</Button>
        </form>
      )}

      {/* ── AI Suggest tab ── */}
      {tab === "ai-suggest" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              🤖 {tr ? "AI Destekli Risk Önerileri" : "AI-Powered Risk Suggestions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded bg-purple-50 border border-purple-200 p-3 text-xs text-purple-700">
              {tr
                ? "AI, şirketinizin sektörü, raporlama çerçeveleri ve emisyon verileri temel alınarak henüz kayıt altına alınmamış iklim risklerini önerir. Önerilen riskleri tek tıkla ekleyebilirsiniz."
                : "AI suggests climate risks not yet registered, based on your company sector, reporting frameworks, and emission data. Accept suggestions with a single click."}
            </div>

            <Button onClick={fetchAiSuggestions} disabled={aiSuggestLoading}>
              {aiSuggestLoading ? (tr ? "Analiz ediliyor… (Ollama)" : "Analyzing… (Ollama)") : (tr ? "AI Önerilerini Getir" : "Fetch AI Suggestions")}
            </Button>

            {aiSuggestMsg && (
              <p className={`text-sm ${aiSuggestMsg.includes("Hata") || aiSuggestMsg.includes("Error") || aiSuggestMsg.includes("hatası") ? "text-red-600" : "text-green-700"}`}>
                {aiSuggestMsg}
              </p>
            )}

            {aiSuggestions.length > 0 && (
              <div className="space-y-3">
                {aiSuggestions.map((s, i) => (
                  <div key={i} className="rounded-lg border border-purple-200 bg-purple-50/40 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-500">
                          {RISK_TYPE_LABELS[s.type]?.[tr ? "tr" : "en"] ?? s.type} •{" "}
                          {tr ? "Olasılık" : "Prob"}: {s.probability} •{" "}
                          {tr ? "Etki" : "Impact"}: {s.impact} •{" "}
                          {s.timeHorizon}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 italic">{s.rationale}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => void acceptSuggestion(s)}
                        className="shrink-0"
                      >
                        {tr ? "+ Ekle" : "+ Add"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Risk detail drawer ── */}
      {selectedRisk && (
        <RiskDetailDrawer
          risk={selectedRisk}
          onClose={() => setSelectedRisk(null)}
          onNarrativeUpdated={(narrative) =>
            setRisks((prev) =>
              prev.map((r) => r.id === selectedRisk.id ? { ...r, aiNarrative: narrative } : r)
            )
          }
        />
      )}
    </div>
  );
}
