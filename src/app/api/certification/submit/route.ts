import { CertificationStatus, ReportStatus } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const { submissionId } = (await request.json()) as { submissionId: string };

    const submission = await prisma.certificationSubmission.findFirstOrThrow({
      where: { id: submissionId, organizationId: user.organizationId },
      include: { report: true },
    });

    const updated = await prisma.certificationSubmission.update({
      where: { id: submission.id },
      data: {
        status:
          submission.status === CertificationStatus.CHANGES_REQUESTED ? CertificationStatus.RESUBMITTED : CertificationStatus.SUBMITTED,
        submittedById: user.id,
        submittedAt: new Date(),
      },
    });

    await prisma.report.update({ where: { id: submission.report.id }, data: { status: ReportStatus.SUBMITTED_FOR_CERTIFICATION, submittedAt: new Date() } });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "CERTIFICATION_SUBMITTED",
      entityType: "CertificationSubmission",
      entityId: submission.id,
      afterValueJson: updated,
    });

    return apiOk(updated);
  } catch (error) {
    return apiError(error, 400);
  }
}
