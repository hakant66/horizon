import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { bulkRevisionSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";
import { createNotifications } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "HORIZON_CONSULTANT"]);
    const body = bulkRevisionSchema.parse(await request.json());

    const { entityType, entityIds, comment, dueDate, reportingPeriodId } = body;
    const dueDateTime = dueDate ? new Date(dueDate) : null;

    const ownerMap: Map<string, string | null> = new Map();

    if (entityType === "METRIC_ENTRY") {
      const entries = await prisma.metricEntry.findMany({
        where: { id: { in: entityIds }, organizationId: user.organizationId },
        select: { id: true, ownerUserId: true, approvalStage: true },
      });

      // Only entries currently in MANAGER_REVIEW, HORIZON_REVIEW, or APPROVED can be sent back.
      const eligible = entries.filter((e) =>
        ["MANAGER_REVIEW", "HORIZON_REVIEW", "APPROVED"].includes(e.approvalStage),
      );

      if (eligible.length === 0) {
        return apiError(
          new Error("No eligible entries found (entries must be in MANAGER_REVIEW, HORIZON_REVIEW, or APPROVED)"),
          400,
        );
      }

      await prisma.metricEntry.updateMany({
        where: { id: { in: eligible.map((e) => e.id) } },
        data: { approvalStage: "REVISION_REQUESTED" },
      });

      for (const e of eligible) ownerMap.set(e.id, e.ownerUserId ?? null);
    } else {
      const answers = await prisma.questionnaireAnswer.findMany({
        where: {
          id: { in: entityIds },
          organizationId: user.organizationId,
          deleted_timestamp: null,
        },
        select: { id: true, answering_user_id: true, approvalStage: true },
      });

      const eligible = answers.filter((a) =>
        ["MANAGER_REVIEW", "HORIZON_REVIEW", "APPROVED"].includes(a.approvalStage),
      );

      if (eligible.length === 0) {
        return apiError(
          new Error("No eligible answers found (answers must be in MANAGER_REVIEW, HORIZON_REVIEW, or APPROVED)"),
          400,
        );
      }

      await prisma.questionnaireAnswer.updateMany({
        where: { id: { in: eligible.map((a) => a.id) } },
        data: { approvalStage: "REVISION_REQUESTED" },
      });

      for (const a of eligible) ownerMap.set(a.id, a.answering_user_id);
    }

    const processedIds = Array.from(ownerMap.keys());

    // Create one Task per entity so owners can track what needs fixing.
    await prisma.task.createMany({
      data: processedIds.map((entityId) => ({
        organizationId: user.organizationId,
        reportingPeriodId: reportingPeriodId ?? null,
        assignedToId: ownerMap.get(entityId) ?? user.id,
        assignedById: user.id,
        title: `Revision requested: ${comment.slice(0, 80)}`,
        description: comment,
        entityType,
        entityId,
        dueDate: dueDateTime,
        priority: "HIGH" as const,
        status: "OPEN" as const,
      })),
      skipDuplicates: true,
    });

    // Notify each unique owner once per batch (deduplicated by userId).
    const uniqueOwners = [...new Set(
      processedIds.map((id) => ownerMap.get(id)).filter((id): id is string => !!id && id !== user.id),
    )];

    await createNotifications(
      uniqueOwners.map((userId) => ({
        organizationId: user.organizationId,
        userId,
        type: "REVISION_REQUESTED" as const,
        title: "Revision requested on your submitted data",
        body: comment,
        entityType,
        entityId: processedIds[0],
      })),
    );

    // Single audit log entry covering the whole batch.
    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "BULK_REVISION_REQUESTED",
      entityType,
      entityId: processedIds.join(","),
      afterValueJson: { comment, entityIds: processedIds, dueDate },
    });

    return apiOk({
      processed: processedIds.length,
      skipped: entityIds.length - processedIds.length,
      entityIds: processedIds,
    });
  } catch (error) {
    return apiError(error, 400);
  }
}
