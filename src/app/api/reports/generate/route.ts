import { ReportStatus } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";
import { getSectorReportTemplates } from "@/lib/sector-mappings";

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const { reportId } = (await request.json()) as { reportId: string };

    const [report, org] = await Promise.all([
      prisma.report.findFirstOrThrow({ where: { id: reportId, organizationId: user.organizationId } }),
      prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { sasbSector: true, reportingFrameworks: true },
      }),
    ]);

    const [metrics, emissions, risks] = await Promise.all([
      prisma.metricEntry.count({ where: { organizationId: user.organizationId, reportingPeriodId: report.reportingPeriodId } }),
      prisma.emissionCalculation.count({ where: { organizationId: user.organizationId, reportingPeriodId: report.reportingPeriodId } }),
      prisma.climateRisk.count({ where: { organizationId: user.organizationId, reportingPeriodId: report.reportingPeriodId } }),
    ]);

    const templates = getSectorReportTemplates(
      org?.sasbSector,
      org?.reportingFrameworks ?? [],
      metrics,
      emissions,
      risks,
    );

    const generated = await prisma.report.update({
      where: { id: report.id },
      data: {
        status: ReportStatus.GENERATED,
        generatedAt: new Date(),
        governanceText:    report.governanceText    || templates.governanceText,
        strategyText:      report.strategyText      || templates.strategyText,
        riskManagementText: report.riskManagementText || templates.riskManagementText,
        metricsTargetsText: report.metricsTargetsText || templates.metricsTargetsText,
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
