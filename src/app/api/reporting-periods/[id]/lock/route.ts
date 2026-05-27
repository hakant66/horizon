import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const { id } = await params;

    const period = await prisma.reportingPeriod.findFirstOrThrow({
      where: { id, organizationId: user.organizationId },
    });

    if (period.status !== "OPEN") {
      return apiError(new Error(`Period is already ${period.status.toLowerCase()}.`), 409);
    }

    const updated = await prisma.reportingPeriod.update({
      where: { id },
      data: { status: "LOCKED", lockedById: user.id, lockedAt: new Date() },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "PERIOD_LOCKED",
      entityType: "ReportingPeriod",
      entityId: id,
      beforeValueJson: { status: period.status },
      afterValueJson: { status: updated.status },
    });

    return apiOk(updated);
  } catch (error) {
    return apiError(error, 400);
  }
}
