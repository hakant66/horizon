import { describe, expect, it } from "vitest";
import {
  calculateEmissionTCO2e,
  calculateEvidenceCoverage,
  calculateMateriality,
  calculateReadinessScore,
  calculateTargetProgress,
} from "@/lib/calculations";

describe("calculation helpers", () => {
  it("computes emission tCO2e", () => {
    expect(calculateEmissionTCO2e(12000, 0.43)).toBeCloseTo(5.16, 4);
  });

  it("marks topic material when threshold reached", () => {
    expect(
      calculateMateriality({
        financialImpactScore: 4,
        impactSeverityScore: 2,
        stakeholderConcernScore: 2,
      }),
    ).toBe(true);
  });

  it("computes target progress and caps bounds", () => {
    const progress = calculateTargetProgress({ baselineValue: 1500, currentValue: 1200, targetValue: 1000 });
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThanOrEqual(100);
  });

  it("computes evidence coverage", () => {
    expect(calculateEvidenceCoverage(8, 10)).toBe(80);
  });

  it("computes readiness score with weighted sections", () => {
    const score = calculateReadinessScore({
      setupCompleted: true,
      requiredMetricsCompletedPercent: 80,
      evidenceCoveragePercent: 70,
      emissionsCalculatedPercent: 65,
      materialityCompleted: true,
      reportGenerated: true,
      certificationSubmitted: false,
    });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
