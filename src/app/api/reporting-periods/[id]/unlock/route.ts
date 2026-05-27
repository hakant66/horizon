import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(["ADMIN"]);
    const { id } = await params;

    const period = await prisma.reportingPeriod.findFirstOrThrow({
      where: { id, organizationId: user.organizationId },
    });

    if (period.status === "OPEN") {
      return apiError(new Error("Period is already open."), 409);
    }

    if (period.status === "CERTIFIED") {
      return apiError(new Error("Certified periods cannot be unlocked."), 422);
    }

    const updated = await prisma.reportingPeriod.update({
      where: { id },
      data: { status: "OPEN", lockedById: null, lockedAt: null },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "PERIOD_UNLOCKED",
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
