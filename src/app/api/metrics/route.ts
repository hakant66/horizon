import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { metricEntrySchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR", "FINANCE_REVIEWER", "AUDITOR"]);
    const { searchParams } = new URL(request.url);
    const reportingPeriodId = searchParams.get("reportingPeriodId") || undefined;
    const facilityId = searchParams.get("facilityId") || undefined;

    const entries = await prisma.metricEntry.findMany({
      where: {
        organizationId: user.organizationId,
        ...(reportingPeriodId ? { reportingPeriodId } : {}),
        ...(facilityId ? { facilityId } : {}),
      },
      include: {
        facility: true,
        metricDefinition: true,
        ownerUser: { select: { id: true, name: true } },
      },
      orderBy: [{ facility: { name: "asc" } }, { metricDefinition: { name: "asc" } }],
    });

    return apiOk(entries);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR"]);
    const payload = metricEntrySchema.parse(await request.json());

    const existing = await prisma.metricEntry.findUnique({
      where: {
        facilityId_reportingPeriodId_metricDefinitionId: {
          facilityId: payload.facilityId,
          reportingPeriodId: payload.reportingPeriodId,
          metricDefinitionId: payload.metricDefinitionId,
        },
      },
    });

    const entry = existing
      ? await prisma.metricEntry.update({
          where: { id: existing.id },
          data: {
            value: payload.value === null || payload.value === undefined ? null : new Prisma.Decimal(payload.value),
            unit: payload.unit,
            status: payload.status || existing.status,
            ownerUserId: payload.ownerUserId || null,
            notes: payload.notes || null,
          },
        })
      : await prisma.metricEntry.create({
          data: {
            organizationId: user.organizationId,
            facilityId: payload.facilityId,
            reportingPeriodId: payload.reportingPeriodId,
            metricDefinitionId: payload.metricDefinitionId,
            value: payload.value === null || payload.value === undefined ? null : new Prisma.Decimal(payload.value),
            unit: payload.unit,
            status: payload.status || "IN_PROGRESS",
            ownerUserId: payload.ownerUserId || null,
            notes: payload.notes || null,
          },
        });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: existing ? "METRIC_ENTRY_UPDATED" : "METRIC_ENTRY_CREATED",
      entityType: "MetricEntry",
      entityId: entry.id,
      afterValueJson: entry,
    });

    return apiOk(entry, existing ? 200 : 201);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR"]);
    const payload = metricEntrySchema.parse(await request.json());
    if (!payload.id) throw new Error("id is required");

    const before = await prisma.metricEntry.findFirstOrThrow({ where: { id: payload.id, organizationId: user.organizationId } });
    const entry = await prisma.metricEntry.update({
      where: { id: payload.id },
      data: {
        value: payload.value === null || payload.value === undefined ? null : new Prisma.Decimal(payload.value),
        unit: payload.unit,
        status: payload.status || before.status,
        ownerUserId: payload.ownerUserId || null,
        notes: payload.notes || null,
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "METRIC_ENTRY_UPDATED",
      entityType: "MetricEntry",
      entityId: entry.id,
      beforeValueJson: before,
      afterValueJson: entry,
    });

    return apiOk(entry);
  } catch (error) {
    return apiError(error, 400);
  }
}
