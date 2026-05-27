import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import type { z } from "zod";
import type { taskSchema } from "@/lib/validation";
import type { AuthUser } from "@/services/types";

type TaskPayload = z.infer<typeof taskSchema>;
type TaskUpdatePayload = Partial<TaskPayload> & { id: string };

const TASK_INCLUDE = {
  assignedTo: { select: { id: true, name: true, email: true } },
  assignedBy: { select: { id: true, name: true } },
} as const;

export async function listTasks(
  user: AuthUser,
  opts: { assignedToMe?: boolean; status?: string; reportingPeriodId?: string } = {},
) {
  return prisma.task.findMany({
    where: {
      organizationId: user.organizationId, // tenant-scope
      ...(opts.assignedToMe ? { assignedToId: user.id } : {}),
      ...(opts.status ? { status: opts.status as never } : {}),
      ...(opts.reportingPeriodId ? { reportingPeriodId: opts.reportingPeriodId } : {}),
    },
    include: TASK_INCLUDE,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });
}

export async function createTask(user: AuthUser, body: TaskPayload) {
  // Verify assignee belongs to the same org.
  await prisma.user.findFirstOrThrow({
    where: { id: body.assignedToId, organizationId: user.organizationId }, // tenant-scope
  });

  const task = await prisma.task.create({
    data: {
      organizationId: user.organizationId,
      reportingPeriodId: body.reportingPeriodId ?? null,
      assignedToId: body.assignedToId,
      assignedById: user.id,
      title: body.title,
      description: body.description ?? null,
      entityType: body.entityType ?? null,
      entityId: body.entityId ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      priority: body.priority,
      status: "OPEN",
    },
    include: TASK_INCLUDE,
  });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "TASK_CREATED",
    entityType: "Task",
    entityId: task.id,
    afterValueJson: task,
  });

  if (body.assignedToId !== user.id) {
    await createNotification({
      organizationId: user.organizationId,
      userId: body.assignedToId,
      type: "TASK_ASSIGNED",
      title: `New task assigned: ${body.title.slice(0, 80)}`,
      body: body.description ?? undefined,
      entityType: "Task",
      entityId: task.id,
    });
  }

  return task;
}

export async function updateTask(user: AuthUser, body: TaskUpdatePayload) {
  const existing = await prisma.task.findFirstOrThrow({
    where: { id: body.id, organizationId: user.organizationId }, // tenant-scope
  });

  const updated = await prisma.task.update({
    where: { id: body.id },
    data: {
      ...(body.title !== undefined       ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.dueDate !== undefined     ? { dueDate: body.dueDate ? new Date(body.dueDate) : null } : {}),
      ...(body.priority !== undefined    ? { priority: body.priority } : {}),
      ...(body.status !== undefined      ? {
        status: body.status,
        completedAt: body.status === "DONE" ? new Date() : existing.completedAt,
      } : {}),
      ...(body.assignedToId !== undefined ? { assignedToId: body.assignedToId } : {}),
    },
    include: TASK_INCLUDE,
  });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "TASK_UPDATED",
    entityType: "Task",
    entityId: updated.id,
    beforeValueJson: existing,
    afterValueJson: updated,
  });

  // Notify new assignee when task is reassigned to someone other than the actor.
  const reassigned =
    body.assignedToId !== undefined &&
    body.assignedToId !== existing.assignedToId &&
    body.assignedToId !== user.id;

  if (reassigned && body.assignedToId) {
    await createNotification({
      organizationId: user.organizationId,
      userId: body.assignedToId,
      type: "TASK_ASSIGNED",
      title: `Task reassigned to you: ${updated.title.slice(0, 80)}`,
      body: updated.description ?? undefined,
      entityType: "Task",
      entityId: updated.id,
    });
  }

  return updated;
}

export async function deleteTask(user: AuthUser, id: string) {
  const existing = await prisma.task.findFirstOrThrow({
    where: { id, organizationId: user.organizationId }, // tenant-scope
  });

  await prisma.task.delete({ where: { id } });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "TASK_DELETED",
    entityType: "Task",
    entityId: id,
    beforeValueJson: existing,
  });
}
