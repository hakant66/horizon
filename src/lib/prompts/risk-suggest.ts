import type { OllamaMessage } from "@/lib/ai-client";

export interface RiskSuggestInput {
  sector: string;
  reportingFrameworks: string[];
  scope1Total: number;
  scope2Total: number;
  scope3Total: number;
  existingRiskNames: string[];
  locale: "tr" | "en";
}

export function buildRiskSuggestMessages(input: RiskSuggestInput): OllamaMessage[] {
  const frameworks = input.reportingFrameworks.length > 0 ? input.reportingFrameworks.join(", ") : "TCFD / GHG Protocol";
  const existing = input.existingRiskNames.length > 0 ? input.existingRiskNames.join("; ") : "None";
  const totalEmissions = input.scope1Total + input.scope2Total + input.scope3Total;

  if (input.locale === "tr") {
    return [
      {
        role: "system",
        content: `Sen bir iklim riski analisti ve ${frameworks} uyum uzmanısın. Şirkete özgü bilgilere dayanarak, henüz kayıt altına alınmamış yeni iklim risklerini öneriyorsun. SADECE JSON dizisi döndür, başka hiçbir şey yazma. Her öğe şu alanları içermeli: name (string), type (PHYSICAL_ACUTE|PHYSICAL_CHRONIC|TRANSITION_POLICY_LEGAL|TRANSITION_MARKET|TRANSITION_TECHNOLOGY|TRANSITION_REPUTATION), probability (High|Medium|Low), impact (High|Medium|Low), timeHorizon (Short-term|Medium-term|Long-term), rationale (string, maksimum 2 cümle, Türkçe).`,
      },
      {
        role: "user",
        content: `Sektör: ${input.sector}
Çerçeveler: ${frameworks}
Kapsam 1 emisyonu: ${input.scope1Total.toFixed(2)} tCO2e
Kapsam 2 emisyonu: ${input.scope2Total.toFixed(2)} tCO2e
Kapsam 3 emisyonu: ${input.scope3Total.toFixed(2)} tCO2e
Toplam emisyon: ${totalEmissions.toFixed(2)} tCO2e
Mevcut riskler: ${existing}

Bu şirket için kayıt altında olmayan 5 iklim riski öner. Yanıtın YALNIZCA JSON dizisi olsun, başka metin olmasın.`,
      },
    ];
  }

  return [
    {
      role: "system",
      content: `You are a climate risk analyst and ${frameworks} compliance expert. Suggest new climate risks not yet registered, based on company-specific data. Return ONLY a JSON array, nothing else. Each item must have: name (string), type (PHYSICAL_ACUTE|PHYSICAL_CHRONIC|TRANSITION_POLICY_LEGAL|TRANSITION_MARKET|TRANSITION_TECHNOLOGY|TRANSITION_REPUTATION), probability (High|Medium|Low), impact (High|Medium|Low), timeHorizon (Short-term|Medium-term|Long-term), rationale (string, max 2 sentences).`,
    },
    {
      role: "user",
      content: `Sector: ${input.sector}
Frameworks: ${frameworks}
Scope 1 emissions: ${input.scope1Total.toFixed(2)} tCO2e
Scope 2 emissions: ${input.scope2Total.toFixed(2)} tCO2e
Scope 3 emissions: ${input.scope3Total.toFixed(2)} tCO2e
Total emissions: ${totalEmissions.toFixed(2)} tCO2e
Existing risks: ${existing}

Suggest 5 climate risks not yet registered for this company. Return ONLY a JSON array.`,
    },
  ];
}
