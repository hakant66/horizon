import type { OllamaMessage } from "@/lib/ai-client";

export interface ScenarioSummaryInput {
  riskName: string;
  riskType: string;
  sector: string;
  scenarios: Array<{
    scenarioName: string;
    temperaturePathway: string;
    scenarioFramework?: string | null;
    estimatedRevenueImpactPercent?: number | null;
    estimatedCostImpact?: number | null;
    qualitativeImpact?: string | null;
    assumptions?: string | null;
  }>;
  locale: "tr" | "en";
}

export function buildScenarioSummaryMessages(input: ScenarioSummaryInput): OllamaMessage[] {
  const scenarioLines = input.scenarios.map((s, i) => {
    const rev = s.estimatedRevenueImpactPercent != null ? `${s.estimatedRevenueImpactPercent}%` : "N/A";
    const cost = s.estimatedCostImpact != null ? `$${s.estimatedCostImpact.toLocaleString()}` : "N/A";
    return `${i + 1}. ${s.temperaturePathway} (${s.scenarioFramework ?? "Custom"}) — Revenue impact: ${rev}, Cost impact: ${cost}
   Qualitative: ${s.qualitativeImpact ?? "Not described"}
   Assumptions: ${s.assumptions ?? "Not stated"}`;
  }).join("\n\n");

  if (input.locale === "tr") {
    return [
      {
        role: "system",
        content: `Sen bir NGFS/IPCC senaryo analizi uzmanısın. Verilen iklim riskine ilişkin birden fazla sıcaklık yolu senaryosunu karşılaştıran, profesyonel bir Türkçe özet yazıyorsun. Markdown kullanma. İki paragraf: 1) Senaryolar arası karşılaştırma, 2) En kritik senaryo ve önerilen öncelik.`,
      },
      {
        role: "user",
        content: `Risk: ${input.riskName} (${input.riskType})
Sektör: ${input.sector}

Senaryolar:
${scenarioLines}

Bu senaryoları karşılaştırarak iki paragraf Türkçe özet yaz.`,
      },
    ];
  }

  return [
    {
      role: "system",
      content: `You are an NGFS/IPCC scenario analysis expert. Write a professional English comparative summary of multiple temperature pathway scenarios for the given climate risk. No markdown. Two paragraphs: 1) Cross-scenario comparison, 2) Most critical scenario and recommended priority.`,
    },
    {
      role: "user",
      content: `Risk: ${input.riskName} (${input.riskType})
Sector: ${input.sector}

Scenarios:
${scenarioLines}

Write a two-paragraph comparative summary.`,
    },
  ];
}
