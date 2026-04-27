import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { targetSchema } from "@/lib/validation";
import { calculateTargetProgress } from "@/lib/calculations";
import { createAuditLog } from "@/lib/audit";
import { apiError, apiOk } from "@/lib/api";

function deriveStatus(progress: number) {
  if (progress >= 66) return "ON_TRACK";
  if (progress >= 33) return "AT_RISK";
  return "OFF_TRACK";
}

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR"]);
    const { searchParams } = new URL(request.url);
    const reportingPeriodId = searchParams.get("reportingPeriodId") || undefined;

    const targets = await prisma.target.findMany({
      where: { organizationId: user.organizationId, ...(reportingPeriodId ? { reportingPeriodId } : {}) },
      include: { metricDefinition: true },
      orderBy: { createdAt: "desc" },
    });

    const withProgress = targets.map((target) => ({
      ...target,
      progress: calculateTargetProgress({
        baselineValue: Number(target.baselineValue),
        currentValue: Number(target.currentValue),
        targetValue: Number(target.targetValue),
      }),
    }));

    return apiOk(withProgress);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const payload = targetSchema.parse(await request.json());
    const progress = calculateTargetProgress(payload);
    const status = payload.status || deriveStatus(progress);

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

    return apiOk(target, 201);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const payload = targetSchema.parse(await request.json());
    if (!payload.id) throw new Error("id required");
    const progress = calculateTargetProgress(payload);
    const status = payload.status || deriveStatus(progress);

    const before = await prisma.target.findFirstOrThrow({ where: { id: payload.id, organizationId: user.organizationId } });
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
    return apiOk(target);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const { id } = (await request.json()) as { id: string };
    const before = await prisma.target.findFirstOrThrow({ where: { id, organizationId: user.organizationId } });
    await prisma.target.delete({ where: { id } });
    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "TARGET_DELETED",
      entityType: "Target",
      entityId: id,
      beforeValueJson: before,
    });
    return apiOk({ success: true });
  } catch (error) {
    return apiError(error, 400);
  }
}
