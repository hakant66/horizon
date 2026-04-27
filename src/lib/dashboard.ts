import { CertificationStatus, ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateEvidenceCoverage, calculateReadinessScore } from "@/lib/calculations";

export async function getDashboardData(organizationId: string, reportingPeriodId?: string) {
  const periodWhere = reportingPeriodId ? { reportingPeriodId } : {};

  const [facilitiesCount, usersCount, metricEntries, evidenceCount, emissionsCount, materialityCount, reportsCount, certCount] =
    await Promise.all([
      prisma.facility.count({ where: { organizationId } }),
      prisma.user.count({ where: { organizationId } }),
      prisma.metricEntry.findMany({
        where: { organizationId, ...periodWhere },
        include: { metricDefinition: true, facility: true },
      }),
      prisma.evidence.findMany({ where: { organizationId } }),
      prisma.emissionCalculation.count({ where: { organizationId, ...periodWhere } }),
      prisma.materialityTopic.count({ where: { organizationId, ...periodWhere } }),
      prisma.report.count({ where: { organizationId, ...periodWhere, status: { in: [ReportStatus.GENERATED, ReportStatus.SUBMITTED_FOR_CERTIFICATION, ReportStatus.APPROVED] } } }),
      prisma.certificationSubmission.count({ where: { organizationId, ...periodWhere, status: { in: [CertificationStatus.SUBMITTED, CertificationStatus.UNDER_REVIEW, CertificationStatus.RESUBMITTED, CertificationStatus.APPROVED] } } }),
    ]);

  const setupCompleted = facilitiesCount > 0 && usersCount > 1;
  const requiredEntries = metricEntries.filter((m) => m.metricDefinition.isRequired);
  const completedRequired = requiredEntries.filter((m) => m.value !== null).length;

  const metricEntryIdsWithEvidence = new Set(
    evidenceCount.filter((e) => e.linkedEntityType === "METRIC_ENTRY").map((e) => e.linkedEntityId),
  );
  const entriesWithEvidence = requiredEntries.filter((entry) => metricEntryIdsWithEvidence.has(entry.id)).length;

  const readiness = calculateReadinessScore({
    setupCompleted,
    requiredMetricsCompletedPercent: requiredEntries.length ? (completedRequired / requiredEntries.length) * 100 : 0,
    evidenceCoveragePercent: calculateEvidenceCoverage(entriesWithEvidence, requiredEntries.length),
    emissionsCalculatedPercent: requiredEntries.length ? (emissionsCount / requiredEntries.length) * 100 : 0,
    materialityCompleted: materialityCount > 0,
    reportGenerated: reportsCount > 0,
    certificationSubmitted: certCount > 0,
  });

  const missingDataAlerts = requiredEntries
    .filter((entry) => entry.value === null)
    .slice(0, 5)
    .map((entry) => ({ metricName: entry.metricDefinition.name, facilityName: entry.facility.name }));

  const totalEmissionsTCO2e = await prisma.emissionCalculation.aggregate({
    where: { organizationId, ...periodWhere },
    _sum: { resultTCO2e: true },
  });

  const energyCodes = ["electricity_consumption", "natural_gas_consumption"];
  const energyEntries = metricEntries.filter((m) => energyCodes.includes(m.metricDefinition.code) && m.value !== null);
  const energyTotal = energyEntries.reduce((sum, row) => sum + Number(row.value || 0), 0);

  return {
    readiness,
    missingDataAlerts,
    evidenceCoverage: calculateEvidenceCoverage(entriesWithEvidence, requiredEntries.length),
    totalEmissionsTCO2e: Number(totalEmissionsTCO2e._sum.resultTCO2e || 0),
    energyTotal,
    certCount,
  };
}
