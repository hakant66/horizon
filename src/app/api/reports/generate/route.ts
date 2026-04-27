import { ReportStatus } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const { reportId } = (await request.json()) as { reportId: string };

    const report = await prisma.report.findFirstOrThrow({ where: { id: reportId, organizationId: user.organizationId } });
    const metrics = await prisma.metricEntry.count({ where: { organizationId: user.organizationId, reportingPeriodId: report.reportingPeriodId } });
    const emissions = await prisma.emissionCalculation.count({ where: { organizationId: user.organizationId, reportingPeriodId: report.reportingPeriodId } });
    const risks = await prisma.climateRisk.count({ where: { organizationId: user.organizationId, reportingPeriodId: report.reportingPeriodId } });

    const generated = await prisma.report.update({
      where: { id: report.id },
      data: {
        status: ReportStatus.GENERATED,
        generatedAt: new Date(),
        governanceText: report.governanceText || "Governance oversight established through cross-functional committees.",
        strategyText: report.strategyText || `Strategy considers ${risks} climate risks for resilience planning.`,
        riskManagementText: report.riskManagementText || `Risk processes cover ${risks} documented climate risks.`,
        metricsTargetsText:
          report.metricsTargetsText || `${metrics} metric records and ${emissions} emissions calculations included in this disclosure package.`,
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "REPORT_GENERATED",
      entityType: "Report",
      entityId: report.id,
      afterValueJson: generated,
    });

    return apiOk(generated);
  } catch (error) {
    return apiError(error, 400);
  }
}
