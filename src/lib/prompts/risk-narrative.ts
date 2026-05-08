import type { OllamaMessage } from "@/lib/ai-client";

export interface RiskNarrativeInput {
  riskName: string;
  riskType: string;
  probability: string;
  impact: string;
  timeHorizon?: string | null;
  mitigationPlan?: string | null;
  regulatoryRef?: string | null;
  financialImpactEstimate?: number | null;
  sector: string;
  reportingFrameworks: string[];
  locale: "tr" | "en";
}

const RISK_TYPE_LABELS: Record<string, { tr: string; en: string }> = {
  PHYSICAL_ACUTE:           { tr: "Fiziksel Ani Risk",                 en: "Physical Acute Risk" },
  PHYSICAL_CHRONIC:         { tr: "Fiziksel Kronik Risk",              en: "Physical Chronic Risk" },
  TRANSITION_POLICY_LEGAL:  { tr: "Geçiş — Politika ve Hukuki Risk",   en: "Transition — Policy & Legal Risk" },
  TRANSITION_MARKET:        { tr: "Geçiş — Piyasa Riski",              en: "Transition — Market Risk" },
  TRANSITION_TECHNOLOGY:    { tr: "Geçiş — Teknoloji Riski",           en: "Transition — Technology Risk" },
  TRANSITION_REPUTATION:    { tr: "Geçiş — İtibar Riski",              en: "Transition — Reputation Risk" },
};

export function buildRiskNarrativeMessages(input: RiskNarrativeInput): OllamaMessage[] {
  const riskTypeLabelObj = RISK_TYPE_LABELS[input.riskType];
  const riskTypeLabel = (input.locale === "tr" ? riskTypeLabelObj?.tr : riskTypeLabelObj?.en) ?? input.riskType;
  const frameworks = input.reportingFrameworks.length > 0 ? input.reportingFrameworks.join(", ") : "GHG Protocol / TCFD";
  const financialStr = input.financialImpactEstimate
    ? `Estimated financial impact: ${input.financialImpactEstimate.toLocaleString()} USD. `
    : "";

  if (input.locale === "tr") {
    return [
      {
        role: "system",
        content: "Sen bir TCFD, IFRS S2 ve ESRS E1 uyum uzmanısın. Verilen iklim riskini raporlama standartlarına uygun, profesyonel ve özlü bir Türkçe anlatıya dönüştürüyorsun. Yanıtın doğrudan bir sürdürülebilirlik raporuna girebilecek kalitede olmalı. Kesinlikle markdown işaretleri kullanma, düz metin ver. Üç paragraf yaz: 1) Riskin tanımı ve şirkete etkisi, 2) Senaryo ve zaman ufku, 3) Azaltım tedbirleri ve artık risk.",
      },
      {
        role: "user",
        content: `Şirket sektörü: ${input.sector}
Raporlama çerçevesi: ${frameworks}
Risk adı: ${input.riskName}
Risk türü: ${riskTypeLabel}
Olasılık: ${input.probability}
Etki: ${input.impact}
Zaman ufku: ${input.timeHorizon ?? "Belirtilmemiş"}
${financialStr}Azaltım planı: ${input.mitigationPlan ?? "Henüz tanımlanmamış"}
Standart referansı: ${input.regulatoryRef ?? "TCFD / IFRS S2 Para. 16"}

Yukarıdaki iklim riskini ${frameworks} gerekliliklerine uygun üç paragraf olarak açıkla.`,
      },
    ];
  }

  return [
    {
      role: "system",
      content: `You are a TCFD, IFRS S2, and ESRS E1 compliance expert. Transform the given climate risk into a professional, concise English narrative suitable for direct inclusion in a sustainability report. Do not use markdown formatting (no **, backticks, or #). Write exactly three paragraphs: 1) Risk description and impact on the company, 2) Scenario and time horizon, 3) Mitigation measures and residual risk.`,
    },
    {
      role: "user",
      content: `Company sector: ${input.sector}
Reporting framework: ${frameworks}
Risk name: ${input.riskName}
Risk type: ${riskTypeLabel}
Probability: ${input.probability}
Impact: ${input.impact}
Time horizon: ${input.timeHorizon ?? "Not specified"}
${financialStr}Mitigation plan: ${input.mitigationPlan ?? "Not yet defined"}
Regulatory reference: ${input.regulatoryRef ?? "TCFD / IFRS S2 Para. 16"}

Write a three-paragraph narrative for this climate risk compliant with ${frameworks} requirements.`,
    },
  ];
}
