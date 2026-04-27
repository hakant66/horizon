import { CertificationStatus } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { certificationSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR"]);
    const { searchParams } = new URL(request.url);
    const reportingPeriodId = searchParams.get("reportingPeriodId") || undefined;

    const rows = await prisma.certificationSubmission.findMany({
      where: { organizationId: user.organizationId, ...(reportingPeriodId ? { reportingPeriodId } : {}) },
      include: {
        report: true,
        submittedBy: { select: { name: true } },
        reviewedBy: { select: { name: true } },
        comments: { include: { authorUser: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    return apiOk(rows);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const payload = certificationSchema.parse(await request.json());

    const submission = await prisma.certificationSubmission.create({
      data: {
        organizationId: user.organizationId,
        reportingPeriodId: payload.reportingPeriodId,
        reportId: payload.reportId,
        status: payload.status || CertificationStatus.DRAFT,
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "CERTIFICATION_CREATED",
      entityType: "CertificationSubmission",
      entityId: submission.id,
      afterValueJson: submission,
    });

    return apiOk(submission, 201);
  } catch (error) {
    return apiError(error, 400);
  }
}
