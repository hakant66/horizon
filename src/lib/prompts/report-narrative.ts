import type { OllamaMessage } from "@/lib/ai-client";

export type ReportSection = "governance" | "strategy" | "riskManagement" | "metricsTargets";

export interface ReportNarrativeInput {
  section: ReportSection;
  organizationName: string;
  sector: string;
  reportingPeriodName: string;
  frameworks: string[];
  context: {
    totalEmissionsTCO2e?: number;
    metricsCount?: number;
    risksCount?: number;
    targetsCount?: number;
    existingText?: string | null;
  };
  locale: "tr" | "en";
}

const SECTION_LABELS: Record<ReportSection, { tr: string; en: string }> = {
  governance:      { tr: "Yönetişim",                          en: "Governance" },
  strategy:        { tr: "Strateji",                           en: "Strategy" },
  riskManagement:  { tr: "Risk Yönetimi",                      en: "Risk Management" },
  metricsTargets:  { tr: "Metrikler ve Hedefler",              en: "Metrics & Targets" },
};

export function buildReportNarrativeMessages(input: ReportNarrativeInput): OllamaMessage[] {
  const fw = input.frameworks.length > 0 ? input.frameworks.join(", ") : "IFRS S2 / TSRS 2";
  const sectionLabel = SECTION_LABELS[input.section];
  const ctx = input.context;

  const contextLines = [
    ctx.totalEmissionsTCO2e !== undefined ? `Total emissions: ${ctx.totalEmissionsTCO2e.toFixed(2)} tCO2e` : null,
    ctx.metricsCount !== undefined ? `Metrics recorded: ${ctx.metricsCount}` : null,
    ctx.risksCount !== undefined ? `Climate risks identified: ${ctx.risksCount}` : null,
    ctx.targetsCount !== undefined ? `Targets set: ${ctx.targetsCount}` : null,
    ctx.existingText ? `Existing text to improve:\n${ctx.existingText}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (input.locale === "tr") {
    return [
      {
        role: "system",
        content: `Sen IFRS S2, TSRS 2 ve TCFD uyum uzmanısın. Şirketin sürdürülebilirlik raporunun "${sectionLabel.tr}" bölümünü yazıyorsun. Profesyonel, özlü ve standartlara uygun Türkçe metin üret. Markdown kullanma. İki ila üç paragraf yaz.`,
      },
      {
        role: "user",
        content: `Şirket: ${input.organizationName}
Sektör: ${input.sector}
Raporlama dönemi: ${input.reportingPeriodName}
Çerçeve: ${fw}

Bağlam:
${contextLines}

"${sectionLabel.tr}" bölümü için rapor metni yaz.`,
      },
    ];
  }

  return [
    {
      role: "system",
      content: `You are an IFRS S2, TSRS 2, and TCFD compliance expert. Write the "${sectionLabel.en}" section of the company's sustainability report. Produce professional, concise, standards-aligned English text. No markdown. Two to three paragraphs.`,
    },
    {
      role: "user",
      content: `Company: ${input.organizationName}
Sector: ${input.sector}
Reporting period: ${input.reportingPeriodName}
Framework: ${fw}

Context:
${contextLines}

Write the "${sectionLabel.en}" section narrative.`,
    },
  ];
}
