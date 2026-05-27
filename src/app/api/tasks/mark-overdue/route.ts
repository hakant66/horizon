import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function POST() {
  try {
    const user = await requireRole(["ADMIN"]);

    const now = new Date();

    const result = await prisma.task.updateMany({
      where: {
        organizationId: user.organizationId,
        status: { in: ["OPEN", "IN_PROGRESS"] },
        dueDate: { lt: now },
      },
      data: { status: "OVERDUE" },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "TASKS_MARKED_OVERDUE",
      entityType: "Task",
      entityId: "batch",
      afterValueJson: { markedOverdue: result.count, at: now.toISOString() },
    });

    return apiOk({ markedOverdue: result.count });
  } catch (error) {
    return apiError(error, 400);
  }
}
