import sanitizeHtml from "sanitize-html";
import { ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import type { z } from "zod";
import type { reportSchema, reportApprovalSchema } from "@/lib/validation";
import type { AuthUser } from "@/services/types";

type ReportPayload        = z.infer<typeof reportSchema>;
type ReportUpdatePayload  = Partial<ReportPayload> & { id: string };
type ApprovalPayload      = z.infer<typeof reportApprovalSchema>;

function sanitizeText(input?: string | null): string {
  return sanitizeHtml(input || "", { allowedTags: [], allowedAttributes: {} });
}

export async function listReports(user: AuthUser, reportingPeriodId?: string) {
  return prisma.report.findMany({
    where: {
      organizationId: user.organizationId, // tenant-scope
      ...(reportingPeriodId ? { reportingPeriodId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReportWithSummary(user: AuthUser, id: string) {
  const report = await prisma.report.findFirstOrThrow({
    where: { id, organizationId: user.organizationId }, // tenant-scope
    include: {
      reportingPeriod: true,
      approvedBy: { select: { id: true, name: true } },
      certifications: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          submittedBy: { select: { name: true } },
          reviewedBy:  { select: { name: true } },
        },
      },
    },
  });

  const [metricsCount, emissionsTotal, risksCount, targetsCount] = await Promise.all([
    prisma.metricEntry.count({
      where: { organizationId: user.organizationId, reportingPeriodId: report.reportingPeriodId },
    }),
    prisma.emissionCalculation.aggregate({
      where: { organizationId: user.organizationId, reportingPeriodId: report.reportingPeriodId },
      _sum: { resultTCO2e: true },
    }),
    prisma.climateRisk.count({
      where: { organizationId: user.organizationId, reportingPeriodId: report.reportingPeriodId },
    }),
    prisma.target.count({
      where: { organizationId: user.organizationId, reportingPeriodId: report.reportingPeriodId },
    }),
  ]);

  return {
    ...report,
    summary: {
      metricsCount,
      totalEmissionsTCO2e: Number(emissionsTotal._sum.resultTCO2e ?? 0),
      risksCount,
      targetsCount,
    },
  };
}

export async function createReport(user: AuthUser, payload: ReportPayload) {
  const report = await prisma.report.create({
    data: {
      organizationId: user.organizationId,
      reportingPeriodId: payload.reportingPeriodId,
      framework: payload.framework,
      governanceText:      sanitizeText(payload.governanceText),
      strategyText:        sanitizeText(payload.strategyText),
      riskManagementText:  sanitizeText(payload.riskManagementText),
      metricsTargetsText:  sanitizeText(payload.metricsTargetsText),
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

  return report;
}

export async function updateReport(user: AuthUser, payload: ReportUpdatePayload) {
  const before = await prisma.report.findFirstOrThrow({
    where: { id: payload.id, organizationId: user.organizationId }, // tenant-scope
  });

  const report = await prisma.report.update({
    where: { id: payload.id },
    data: {
      ...(payload.framework            ? { framework: payload.framework } : {}),
      ...(payload.governanceText      !== undefined ? { governanceText:     sanitizeText(payload.governanceText) }     : {}),
      ...(payload.strategyText        !== undefined ? { strategyText:       sanitizeText(payload.strategyText) }       : {}),
      ...(payload.riskManagementText  !== undefined ? { riskManagementText: sanitizeText(payload.riskManagementText) } : {}),
      ...(payload.metricsTargetsText  !== undefined ? { metricsTargetsText: sanitizeText(payload.metricsTargetsText) } : {}),
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

  return report;
}

export async function approveReport(user: AuthUser, id: string, body: ApprovalPayload) {
  const report = await prisma.report.findFirstOrThrow({
    where: { id, organizationId: user.organizationId }, // tenant-scope
  });

  if (report.status === ReportStatus.APPROVED) {
    throw Object.assign(new Error("Report is already approved."), { httpStatus: 409 });
  }
  if (report.status === ReportStatus.DRAFT) {
    throw Object.assign(new Error("Report must be generated before it can be approved."), { httpStatus: 422 });
  }

  const updated = await prisma.report.update({
    where: { id },
    data: {
      status: ReportStatus.APPROVED,
      approvedById: user.id,
      approvedAt: new Date(),
    },
  });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "REPORT_APPROVED",
    entityType: "Report",
    entityId: id,
    beforeValueJson: { status: report.status },
    afterValueJson:  { status: updated.status, notes: body.notes, approvedById: user.id },
  });

  // Notify sustainability managers (skip the actor).
  const managers = await prisma.user.findMany({
    where: { organizationId: user.organizationId, role: "SUSTAINABILITY_MANAGER" },
    select: { id: true },
  });

  await Promise.all(
    managers
      .map((m) => m.id)
      .filter((uid) => uid !== user.id)
      .map((userId) =>
        createNotification({
          organizationId: user.organizationId,
          userId,
          type: "REPORT_READY_FOR_REVIEW",
          title: "Report has been approved",
          body: body.notes ?? undefined,
          entityType: "Report",
          entityId: id,
        }),
      ),
  );

  return updated;
}
