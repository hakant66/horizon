import type { OllamaMessage } from "@/lib/ai-client";

export interface MetricReviewInput {
  entries: Array<{
    metricCode: string;
    metricName: string;
    category: string;
    value: number | null;
    unit: string;
    facilityName: string;
    anomaly?: { pctChange: number; isWarning: boolean } | null;
  }>;
  reportingPeriodName: string;
  sector: string;
  locale: "tr" | "en";
}

export function buildMetricsReviewMessages(input: MetricReviewInput): OllamaMessage[] {
  const missing = input.entries.filter((e) => e.value === null).length;
  const withAnomalies = input.entries.filter((e) => e.anomaly?.isWarning).length;
  const total = input.entries.length;

  const entrySummary = input.entries
    .slice(0, 30)
    .map((e) => {
      const anomalyNote = e.anomaly ? ` [YoY change: ${e.anomaly.pctChange.toFixed(0)}%]` : "";
      return `${e.facilityName} | ${e.metricCode} | ${e.value !== null ? `${e.value} ${e.unit}` : "MISSING"}${anomalyNote}`;
    })
    .join("\n");

  if (input.locale === "tr") {
    return [
      {
        role: "system",
        content:
          "Sen bir sürdürülebilirlik veri kalitesi uzmanısın. Verilen metrik girişlerini analiz ederek veri kalitesi sorunlarını, tutarsızlıkları ve iyileştirme önerilerini özetle. Yanıtın doğrudan raporlanabilir nitelikte olsun. Markdown kullanma. Maksimum 200 kelime.",
      },
      {
        role: "user",
        content: `Raporlama dönemi: ${input.reportingPeriodName}
Sektör: ${input.sector}
Toplam metrik: ${total}, Eksik: ${missing}, Anomali uyarısı: ${withAnomalies}

Veri özeti:
${entrySummary}

Bu metrikleri veri kalitesi açısından değerlendir: eksik değerlerin önceliği, anomalilerin açıklaması ve hangi metriklerin doğrulanması gerektiğini belirt.`,
      },
    ];
  }

  return [
    {
      role: "system",
      content:
        "You are a sustainability data quality expert. Analyse the given metric entries and summarise data quality issues, inconsistencies, and improvement recommendations. Response should be directly reportable. No markdown. Maximum 200 words.",
    },
    {
      role: "user",
      content: `Reporting period: ${input.reportingPeriodName}
Sector: ${input.sector}
Total metrics: ${total}, Missing: ${missing}, Anomaly warnings: ${withAnomalies}

Data summary:
${entrySummary}

Evaluate these metrics for data quality: flag high-priority missing values, explain anomalies, and identify which metrics need verification.`,
    },
  ];
}
