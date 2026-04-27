import { safePercent } from "@/lib/utils";

export function calculateMateriality(topic: {
  financialImpactScore: number;
  impactSeverityScore: number;
  stakeholderConcernScore: number;
}) {
  return (
    topic.financialImpactScore >= 4 ||
    topic.impactSeverityScore >= 4 ||
    topic.stakeholderConcernScore >= 4
  );
}

export function calculateEmissionTCO2e(activityValue: number, factorValue: number) {
  return (activityValue * factorValue) / 1000;
}

export function calculateTargetProgress(params: {
  baselineValue: number;
  currentValue: number;
  targetValue: number;
}) {
  const denom = params.baselineValue - params.targetValue;
  if (denom === 0) return 0;
  const raw = ((params.baselineValue - params.currentValue) / denom) * 100;
  return Math.max(0, Math.min(100, raw));
}

export function calculateEvidenceCoverage(withEvidence: number, totalRequired: number) {
  return safePercent(withEvidence, totalRequired);
}

export function calculateReadinessScore(input: {
  setupCompleted: boolean;
  requiredMetricsCompletedPercent: number;
  evidenceCoveragePercent: number;
  emissionsCalculatedPercent: number;
  materialityCompleted: boolean;
  reportGenerated: boolean;
  certificationSubmitted: boolean;
}) {
  const setup = input.setupCompleted ? 15 : 0;
  const required = safePercent(input.requiredMetricsCompletedPercent, 100) * 0.25;
  const evidence = safePercent(input.evidenceCoveragePercent, 100) * 0.2;
  const emissions = safePercent(input.emissionsCalculatedPercent, 100) * 0.15;
  const materiality = input.materialityCompleted ? 10 : 0;
  const report = input.reportGenerated ? 10 : 0;
  const cert = input.certificationSubmitted ? 5 : 0;
  return Math.round(setup + required + evidence + emissions + materiality + report + cert);
}
