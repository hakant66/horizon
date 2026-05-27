import { CertificationStatus } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const user = await requireRole(["AUDITOR", "HORIZON_CONSULTANT"]);
    const { submissionId, status, decisionNotes } = (await request.json()) as {
      submissionId: string;
      status: CertificationStatus;
      decisionNotes?: string;
    };

    const allowedStatuses: CertificationStatus[] = [
      CertificationStatus.APPROVED,
      CertificationStatus.REJECTED,
      CertificationStatus.CHANGES_REQUESTED,
      CertificationStatus.UNDER_REVIEW,
    ];

    if (!allowedStatuses.includes(status)) {
      throw new Error("Invalid decision status");
    }

    const submission = await prisma.certificationSubmission.findFirstOrThrow({ where: { id: submissionId, organizationId: user.organizationId } });
    const updated = await prisma.certificationSubmission.update({
      where: { id: submission.id },
      data: {
        status,
        reviewedById: user.id,
        reviewedAt: new Date(),
        decisionNotes,
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: status === CertificationStatus.APPROVED ? "CERTIFICATION_APPROVED" : status === CertificationStatus.REJECTED ? "CERTIFICATION_REJECTED" : "CERTIFICATION_STATUS_UPDATED",
      entityType: "CertificationSubmission",
      entityId: submission.id,
      afterValueJson: updated,
    });

    return apiOk(updated);
  } catch (error) {
    return apiError(error, 400);
  }
}
