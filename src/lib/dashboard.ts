import { CertificationStatus, EmissionScope, ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateEvidenceCoverage, calculateReadinessScore } from "@/lib/calculations";
import { safePercent } from "@/lib/utils";

export async function getDashboardData(organizationId: string, reportingPeriodId?: string) {
  const periodWhere = reportingPeriodId ? { reportingPeriodId } : {};

  const [
    facilitiesCount,
    usersCount,
    metricEntries,
    evidenceList,
    emissionsCount,
    materialityCount,
    reportsCount,
    certCount,
    overdueTaskCount,
    allEmissions,
  ] = await Promise.all([
    prisma.facility.count({ where: { organizationId } }),
    prisma.user.count({ where: { organizationId } }),
    prisma.metricEntry.findMany({
      where: { organizationId, ...periodWhere },
      include: { metricDefinition: true, facility: true },
    }),
    prisma.evidence.findMany({ where: { organizationId } }),
    prisma.emissionCalculation.count({ where: { organizationId, ...periodWhere } }),
    prisma.materialityTopic.count({ where: { organizationId, ...periodWhere } }),
    prisma.report.count({
      where: {
        organizationId,
        ...periodWhere,
        status: {
          in: [
            ReportStatus.GENERATED,
            ReportStatus.SUBMITTED_FOR_CERTIFICATION,
            ReportStatus.APPROVED,
          ],
        },
      },
    }),
    prisma.certificationSubmission.count({
      where: {
        organizationId,
        ...periodWhere,
        status: {
          in: [
            CertificationStatus.SUBMITTED,
            CertificationStatus.UNDER_REVIEW,
            CertificationStatus.RESUBMITTED,
            CertificationStatus.APPROVED,
          ],
        },
      },
    }),
    // Overdue tasks: past due date and not yet done/cancelled.
    prisma.task.count({
      where: {
        organizationId,
        dueDate: { lt: new Date() },
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
    // All emission calculations for scope completeness.
    prisma.emissionCalculation.findMany({
      where: { organizationId, ...periodWhere },
      select: { scope: true },
    }),
  ]);

  // ── Readiness score (existing logic) ──────────────────────────────────────
  const setupCompleted = facilitiesCount > 0 && usersCount > 1;
  const requiredEntries = metricEntries.filter((m) => m.metricDefinition.isRequired);
  const completedRequired = requiredEntries.filter((m) => m.value !== null).length;

  const metricEntryIdsWithEvidence = new Set(
    evidenceList
      .filter((e) => e.linkedEntityType === "METRIC_ENTRY")
      .map((e) => e.linkedEntityId),
  );
  const entriesWithEvidence = requiredEntries.filter((entry) =>
    metricEntryIdsWithEvidence.has(entry.id),
  ).length;

  const readiness = calculateReadinessScore({
    setupCompleted,
    requiredMetricsCompletedPercent: requiredEntries.length
      ? (completedRequired / requiredEntries.length) * 100
      : 0,
    evidenceCoveragePercent: calculateEvidenceCoverage(
      entriesWithEvidence,
      requiredEntries.length,
    ),
    emissionsCalculatedPercent: requiredEntries.length
      ? (emissionsCount / requiredEntries.length) * 100
      : 0,
    materialityCompleted: materialityCount > 0,
    reportGenerated: reportsCount > 0,
    certificationSubmitted: certCount > 0,
  });

  const missingDataAlerts = requiredEntries
    .filter((entry) => entry.value === null)
    .slice(0, 8)
    .map((entry) => ({
      metricName: entry.metricDefinition.name,
      facilityName: entry.facility.name,
    }));

  const totalEmissionsTCO2e = await prisma.emissionCalculation.aggregate({
    where: { organizationId, ...periodWhere },
    _sum: { resultTCO2e: true },
  });

  const energyCodes = ["electricity_consumption", "natural_gas_consumption"];
  const energyEntries = metricEntries.filter(
    (m) => energyCodes.includes(m.metricDefinition.code) && m.value !== null,
  );
  const energyTotal = energyEntries.reduce((sum, row) => sum + Number(row.value || 0), 0);

  // ── Phase 2: Completeness metrics ─────────────────────────────────────────

  // Fill rate: answered questionnaire questions / total active questions.
  let fillRate = 0;
  if (reportingPeriodId) {
    const [totalActiveQuestions, answeredCount] = await Promise.all([
      prisma.questionnaireQuestion.count({
        where: { organizationId, isActive: true },
      }),
      prisma.questionnaireAnswer.count({
        where: {
          organizationId,
          reportingPeriodId,
          deleted_timestamp: null,
        },
      }),
    ]);
    fillRate = safePercent(answeredCount, totalActiveQuestions);
  }

  // Validated rate: VALIDATED metric entries / total metric entries for period.
  const validatedCount = metricEntries.filter((m) => m.status === "VALIDATED").length;
  const validatedRate = safePercent(validatedCount, metricEntries.length);

  // Unevidenced answers: verbal answers with no linked Evidence record.
  let unevidencedAnswerCount = 0;
  if (reportingPeriodId) {
    const evidencedAnswerIds = new Set(
      evidenceList
        .filter((e) => e.linkedEntityType === "QUESTIONNAIRE_ANSWER")
        .map((e) => e.linkedEntityId),
    );
    const verbalAnswers = await prisma.questionnaireAnswer.findMany({
      where: {
        organizationId,
        reportingPeriodId,
        deleted_timestamp: null,
        answer_text: { not: null },
      },
      select: { id: true },
    });
    unevidencedAnswerCount = verbalAnswers.filter((a) => !evidencedAnswerIds.has(a.id)).length;
  }

  // Critical gaps: mandatory questions with no answer for the reporting period.
  let criticalGapCount = 0;
  if (reportingPeriodId) {
    const mandatoryQuestions = await prisma.questionnaireQuestion.findMany({
      where: { organizationId, isMandatory: true, isActive: true },
      select: { id: true },
    });
    const answeredMandatoryIds = await prisma.questionnaireAnswer.findMany({
      where: {
        organizationId,
        reportingPeriodId,
        deleted_timestamp: null,
        questionnaireQuestionId: { in: mandatoryQuestions.map((q) => q.id) },
      },
      select: { questionnaireQuestionId: true },
    });
    const answeredSet = new Set(answeredMandatoryIds.map((a) => a.questionnaireQuestionId));
    criticalGapCount = mandatoryQuestions.filter((q) => !answeredSet.has(q.id)).length;
  }

  // Scope completeness: presence of at least one calculation per scope.
  const scopeFlags = {
    scope1: allEmissions.some((e) => e.scope === EmissionScope.SCOPE_1),
    scope2: allEmissions.some((e) => e.scope === EmissionScope.SCOPE_2),
    scope3: allEmissions.some((e) => e.scope === EmissionScope.SCOPE_3),
  };

  // Metric-level scope completeness by MetricDefinition category proxy.
  const scope1Metrics = metricEntries.filter((m) =>
    ["Fuel", "Energy"].includes(m.metricDefinition.category) &&
    !["electricity_consumption", "district_heat_consumption"].includes(m.metricDefinition.code),
  );
  const scope2Metrics = metricEntries.filter((m) =>
    ["electricity_consumption", "district_heat_consumption"].includes(m.metricDefinition.code),
  );
  const scope3Metrics = metricEntries.filter((m) => m.metricDefinition.category === "Scope3");

  const scopeCompleteness = {
    scope1: safePercent(
      scope1Metrics.filter((m) => m.value !== null).length,
      scope1Metrics.length,
    ),
    scope2: safePercent(
      scope2Metrics.filter((m) => m.value !== null).length,
      scope2Metrics.length,
    ),
    scope3: safePercent(
      scope3Metrics.filter((m) => m.value !== null).length,
      scope3Metrics.length,
    ),
    hasScope1Calculations: scopeFlags.scope1,
    hasScope2Calculations: scopeFlags.scope2,
    hasScope3Calculations: scopeFlags.scope3,
  };

  return {
    // Original fields
    readiness,
    missingDataAlerts,
    evidenceCoverage: calculateEvidenceCoverage(entriesWithEvidence, requiredEntries.length),
    totalEmissionsTCO2e: Number(totalEmissionsTCO2e._sum.resultTCO2e || 0),
    energyTotal,
    certCount,
    // Phase 2 completeness metrics
    fillRate,
    validatedRate,
    overdueTaskCount,
    unevidencedAnswerCount,
    criticalGapCount,
    scopeCompleteness,
  };
}
