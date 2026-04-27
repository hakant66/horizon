import sanitizeHtml from "sanitize-html";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validation";
import { createAuditLog } from "@/lib/audit";
import { apiError, apiOk } from "@/lib/api";

function sanitizeText(input?: string | null) {
  return sanitizeHtml(input || "", { allowedTags: [], allowedAttributes: {} });
}

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR"]);
    const { searchParams } = new URL(request.url);
    const reportingPeriodId = searchParams.get("reportingPeriodId") || undefined;

    const reports = await prisma.report.findMany({
      where: { organizationId: user.organizationId, ...(reportingPeriodId ? { reportingPeriodId } : {}) },
      orderBy: { createdAt: "desc" },
    });
    return apiOk(reports);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const payload = reportSchema.parse(await request.json());

    const report = await prisma.report.create({
      data: {
        organizationId: user.organizationId,
        reportingPeriodId: payload.reportingPeriodId,
        framework: payload.framework,
        governanceText: sanitizeText(payload.governanceText),
        strategyText: sanitizeText(payload.strategyText),
        riskManagementText: sanitizeText(payload.riskManagementText),
        metricsTargetsText: sanitizeText(payload.metricsTargetsText),
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "REPORT_CREATED",
      entityType: "Report",
      entityId: report.id,
      afterValueJson: report,
    });

    return apiOk(report, 201);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER"]);
    const payload = reportSchema.partial().extend({ id: reportSchema.shape.id }).parse(await request.json());
    if (!payload.id) throw new Error("id required");

    const before = await prisma.report.findFirstOrThrow({ where: { id: payload.id, organizationId: user.organizationId } });
    const report = await prisma.report.update({
      where: { id: payload.id },
      data: {
        ...(payload.framework ? { framework: payload.framework } : {}),
        ...(payload.governanceText !== undefined ? { governanceText: sanitizeText(payload.governanceText) } : {}),
        ...(payload.strategyText !== undefined ? { strategyText: sanitizeText(payload.strategyText) } : {}),
        ...(payload.riskManagementText !== undefined ? { riskManagementText: sanitizeText(payload.riskManagementText) } : {}),
        ...(payload.metricsTargetsText !== undefined ? { metricsTargetsText: sanitizeText(payload.metricsTargetsText) } : {}),
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "REPORT_UPDATED",
      entityType: "Report",
      entityId: report.id,
      beforeValueJson: before,
      afterValueJson: report,
    });

    return apiOk(report);
  } catch (error) {
    return apiError(error, 400);
  }
}
