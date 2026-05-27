import { describe, expect, it } from "vitest";
import { buildMetricsReviewMessages } from "@/lib/prompts/metrics-review";
import { buildReportNarrativeMessages, type ReportSection } from "@/lib/prompts/report-narrative";

const SECTIONS: ReportSection[] = ["governance", "strategy", "riskManagement", "metricsTargets"];

// ── buildMetricsReviewMessages ────────────────────────────────────────────────

describe("buildMetricsReviewMessages", () => {
  const base = {
    entries: [
      { metricCode: "electricity_consumption", metricName: "Electricity", category: "Energy", value: 50000, unit: "kWh", facilityName: "Plant A", anomaly: null },
      { metricCode: "natural_gas_consumption", metricName: "Gas", category: "Fuel", value: null, unit: "m3", facilityName: "Plant B", anomaly: null },
    ],
    reportingPeriodName: "2025",
    sector: "Manufacturing",
    locale: "en" as const,
  };

  it("returns two messages (system + user)", () => {
    const msgs = buildMetricsReviewMessages(base);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe("system");
    expect(msgs[1].role).toBe("user");
  });

  it("user message includes missing count", () => {
    const msgs = buildMetricsReviewMessages(base);
    expect(msgs[1].content).toContain("Missing: 1");
  });

  it("user message includes period name", () => {
    const msgs = buildMetricsReviewMessages(base);
    expect(msgs[1].content).toContain("2025");
  });

  it("returns Turkish messages when locale is tr", () => {
    const msgs = buildMetricsReviewMessages({ ...base, locale: "tr" });
    expect(msgs[0].content).toContain("sürdürülebilirlik");
  });

  it("includes anomaly warning in entry summary", () => {
    const withAnomaly = {
      ...base,
      entries: [
        { ...base.entries[0], anomaly: { pctChange: 75, isWarning: true, isBlock: false } },
      ],
    };
    const msgs = buildMetricsReviewMessages(withAnomaly);
    expect(msgs[1].content).toContain("YoY change: 75%");
  });

  it("caps entry summary at 30 entries", () => {
    const manyEntries = Array.from({ length: 50 }, (_, i) => ({
      metricCode: `code_${i}`,
      metricName: `Metric ${i}`,
      category: "Energy",
      value: i * 100,
      unit: "kWh",
      facilityName: "Plant",
      anomaly: null,
    }));
    const msgs = buildMetricsReviewMessages({ ...base, entries: manyEntries });
    const lines = msgs[1].content.split("\n").filter((l) => l.includes("Plant |"));
    expect(lines.length).toBeLessThanOrEqual(30);
  });
});

// ── buildReportNarrativeMessages ──────────────────────────────────────────────

describe("buildReportNarrativeMessages", () => {
  const base = {
    organizationName: "Demo A.Ş.",
    sector: "Manufacturing",
    reportingPeriodName: "2025",
    frameworks: ["IFRS_S2", "TSRS_2"],
    context: { totalEmissionsTCO2e: 1234.5, metricsCount: 20, risksCount: 5, targetsCount: 3 },
    locale: "en" as const,
  };

  for (const section of SECTIONS) {
    it(`returns two messages for section: ${section}`, () => {
      const msgs = buildReportNarrativeMessages({ ...base, section });
      expect(msgs).toHaveLength(2);
    });

    it(`user message for ${section} contains company name`, () => {
      const msgs = buildReportNarrativeMessages({ ...base, section });
      expect(msgs[1].content).toContain("Demo A.Ş.");
    });
  }

  it("returns Turkish messages when locale is tr", () => {
    const msgs = buildReportNarrativeMessages({ ...base, section: "governance", locale: "tr" });
    expect(msgs[0].content).toContain("uzman");
  });

  it("includes emission total in context", () => {
    const msgs = buildReportNarrativeMessages({ ...base, section: "metricsTargets" });
    expect(msgs[1].content).toContain("1234.50 tCO2e");
  });

  it("includes existing text when provided", () => {
    const msgs = buildReportNarrativeMessages({
      ...base,
      section: "governance",
      context: { ...base.context, existingText: "Previous draft text." },
    });
    expect(msgs[1].content).toContain("Previous draft text.");
  });

  it("falls back to IFRS S2 / TSRS 2 when frameworks array is empty", () => {
    const msgs = buildReportNarrativeMessages({ ...base, section: "strategy", frameworks: [] });
    expect(msgs[1].content).toContain("IFRS S2 / TSRS 2");
  });
});
