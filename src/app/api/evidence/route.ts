import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { evidenceSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR", "FINANCE_REVIEWER", "AUDITOR"]);
    const { searchParams } = new URL(request.url);
    const linkedEntityId = searchParams.get("linkedEntityId") || undefined;
    const evidence = await prisma.evidence.findMany({
      where: {
        organizationId: user.organizationId,
        ...(linkedEntityId ? { linkedEntityId } : {}),
      },
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return apiOk(evidence);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR"]);
    const { id, ...rest } = (await request.json()) as { id: string } & Record<string, unknown>;
    if (!id) throw new Error("id required");
    const payload = evidenceSchema.partial().parse(rest);

    const before = await prisma.evidence.findFirstOrThrow({ where: { id, organizationId: user.organizationId } });
    const evidence = await prisma.evidence.update({
      where: { id },
      data: {
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.reviewerComment !== undefined ? { reviewerComment: payload.reviewerComment } : {}),
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "EVIDENCE_STATUS_UPDATED",
      entityType: "Evidence",
      entityId: id,
      beforeValueJson: before,
      afterValueJson: evidence,
    });
    return apiOk(evidence);
  } catch (error) {
    return apiError(error, 400);
  }
}
