import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { commentSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR", "HORIZON_CONSULTANT"]);
    const payload = commentSchema.parse(await request.json());

    const submission = await prisma.certificationSubmission.findFirstOrThrow({
      where: { id: payload.certificationSubmissionId, organizationId: user.organizationId },
    });

    const comment = await prisma.certificationComment.create({
      data: {
        certificationSubmissionId: submission.id,
        authorUserId: user.id,
        comment: payload.comment,
        linkedEntityType: payload.linkedEntityType,
        linkedEntityId: payload.linkedEntityId,
      },
      include: { authorUser: { select: { name: true } } },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "AUDITOR_COMMENT_ADDED",
      entityType: "CertificationComment",
      entityId: comment.id,
      afterValueJson: comment,
    });

    return apiOk(comment, 201);
  } catch (error) {
    return apiError(error, 400);
  }
}
