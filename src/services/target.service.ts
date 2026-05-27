import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { calculateTargetProgress } from "@/lib/calculations";
import type { z } from "zod";
import type { targetSchema } from "@/lib/validation";
import type { AuthUser } from "@/services/types";

type TargetPayload = z.infer<typeof targetSchema>;

export function deriveTargetStatus(progress: number): "ON_TRACK" | "AT_RISK" | "OFF_TRACK" {
  if (progress >= 66) return "ON_TRACK";
  if (progress >= 33) return "AT_RISK";
  return "OFF_TRACK";
}

export async function listTargets(user: AuthUser, reportingPeriodId?: string) {
  const targets = await prisma.target.findMany({
    where: {
      organizationId: user.organizationId, // tenant-scope
      ...(reportingPeriodId ? { reportingPeriodId } : {}),
    },
    include: { metricDefinition: true },
    orderBy: { createdAt: "desc" },
  });

  return targets.map((target) => ({
    ...target,
    progress: calculateTargetProgress({
      baselineValue: Number(target.baselineValue),
      currentValue: Number(target.currentValue),
      targetValue: Number(target.targetValue),
    }),
  }));
}

export async function createTarget(user: AuthUser, payload: TargetPayload) {
  const progress = calculateTargetProgress(payload);
  const status = payload.status || deriveTargetStatus(progress);

  const target = await prisma.target.create({
    data: {
      organizationId: user.organizationId,
      reportingPeriodId: payload.reportingPeriodId,
      name: payload.name,
      metricDefinitionId: payload.metricDefinitionId,
      baselineYear: payload.baselineYear,
      baselineValue: new Prisma.Decimal(payload.baselineValue),
      targetYear: payload.targetYear,
      targetValue: new Prisma.Decimal(payload.targetValue),
      currentValue: new Prisma.Decimal(payload.currentValue),
      status,
    },
  });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "TARGET_CREATED",
    entityType: "Target",
    entityId: target.id,
    afterValueJson: target,
  });

  return target;
}

export async function updateTarget(user: AuthUser, payload: TargetPayload) {
  if (!payload.id) throw new Error("id required");

  const before = await prisma.target.findFirstOrThrow({
    where: { id: payload.id, organizationId: user.organizationId }, // tenant-scope
  });

  const progress = calculateTargetProgress(payload);
  const status = payload.status || deriveTargetStatus(progress);

  const target = await prisma.target.update({
    where: { id: payload.id },
    data: {
      name: payload.name,
      metricDefinitionId: payload.metricDefinitionId,
      baselineYear: payload.baselineYear,
      baselineValue: new Prisma.Decimal(payload.baselineValue),
      targetYear: payload.targetYear,
      targetValue: new Prisma.Decimal(payload.targetValue),
      currentValue: new Prisma.Decimal(payload.currentValue),
      status,
    },
  });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "TARGET_UPDATED",
    entityType: "Target",
    entityId: target.id,
    beforeValueJson: before,
    afterValueJson: target,
  });

  return target;
}

export async function deleteTarget(user: AuthUser, id: string) {
  const before = await prisma.target.findFirstOrThrow({
    where: { id, organizationId: user.organizationId }, // tenant-scope
  });

  await prisma.target.delete({ where: { id } });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "TARGET_DELETED",
    entityType: "Target",
    entityId: id,
    beforeValueJson: before,
  });
}
