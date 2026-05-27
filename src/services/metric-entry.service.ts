import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { getSectorMetricCodes } from "@/lib/sector-mappings";
import { validateTransition } from "@/lib/approval";
import { detectAnomaly } from "@/lib/anomaly";
import { transitionRequiresEvidence, hasEvidence } from "@/lib/evidence-gate";
import { assertPeriodOpen } from "@/lib/period-guard";
import type { z } from "zod";
import type { metricEntrySchema, approvalStageTransitionSchema } from "@/lib/validation";
import type { AuthUser } from "@/services/types";

type MetricPayload      = z.infer<typeof metricEntrySchema>;
type TransitionPayload  = z.infer<typeof approvalStageTransitionSchema>;

// ─── list ─────────────────────────────────────────────────────────────────────

export async function listMetricEntries(
  user: AuthUser,
  opts: { reportingPeriodId?: string; facilityId?: string } = {},
) {
  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { sasbSector: true },
  });
  const sectorMetricCodes = getSectorMetricCodes(org?.sasbSector);

  return prisma.metricEntry.findMany({
    where: {
      organizationId: user.organizationId, // tenant-scope
      ...(opts.reportingPeriodId ? { reportingPeriodId: opts.reportingPeriodId } : {}),
      ...(opts.facilityId        ? { facilityId: opts.facilityId }               : {}),
      metricDefinition: { code: { in: sectorMetricCodes } },
    },
    include: {
      facility: true,
      metricDefinition: true,
      ownerUser: { select: { id: true, name: true } },
    },
    orderBy: [{ facility: { name: "asc" } }, { metricDefinition: { name: "asc" } }],
  });
}

// ─── upsert (POST) ─────────────────────────────────────────────────────────────

export async function upsertMetricEntry(user: AuthUser, payload: MetricPayload) {
  await assertPeriodOpen(payload.reportingPeriodId, user.organizationId);

  const [existing, prevValue] = await Promise.all([
    prisma.metricEntry.findUnique({
      where: {
        facilityId_reportingPeriodId_metricDefinitionId: {
          facilityId: payload.facilityId,
          reportingPeriodId: payload.reportingPeriodId,
          metricDefinitionId: payload.metricDefinitionId,
        },
      },
    }),
    resolvePrevPeriodValue(user.organizationId, payload),
  ]);

  // Block anomalies before writing.
  if (prevValue !== null && payload.value !== null && payload.value !== undefined) {
    const preCheck = detectAnomaly(payload.value, prevValue);
    if (preCheck?.isBlock) {
      throw new Error(
        `Year-over-year change of ${preCheck.pctChange.toFixed(0)}% exceeds the ±500% limit. Please verify your data.`,
      );
    }
  }

  const toDecimal = (v: number | null | undefined) =>
    v === null || v === undefined ? null : new Prisma.Decimal(v);

  const entry = existing
    ? await prisma.metricEntry.update({
        where: { id: existing.id },
        data: {
          value: toDecimal(payload.value),
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
          value: toDecimal(payload.value),
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

  const anomaly =
    prevValue !== null && entry.value !== null
      ? detectAnomaly(Number(entry.value), prevValue)
      : null;

  return { ...entry, anomaly, isNew: !existing };
}

// ─── update (PATCH — data fields only) ────────────────────────────────────────

export async function updateMetricEntry(user: AuthUser, payload: MetricPayload) {
  if (!payload.id) throw new Error("id is required");

  const before = await prisma.metricEntry.findFirstOrThrow({
    where: { id: payload.id, organizationId: user.organizationId }, // tenant-scope
  });

  const toDecimal = (v: number | null | undefined) =>
    v === null || v === undefined ? null : new Prisma.Decimal(v);

  const entry = await prisma.metricEntry.update({
    where: { id: payload.id },
    data: {
      value: toDecimal(payload.value),
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

  return entry;
}

// ─── stage transition (PATCH — approval only) ──────────────────────────────────

export async function transitionMetricStage(user: AuthUser, payload: TransitionPayload) {
  const entry = await prisma.metricEntry.findFirstOrThrow({
    where: { id: payload.id, organizationId: user.organizationId }, // tenant-scope
    include: { ownerUser: { select: { id: true } } },
  });

  const transitionError = validateTransition(
    entry.approvalStage,
    payload.approvalStage,
    user.role as UserRole,
  );
  if (transitionError) {
    throw Object.assign(new Error(transitionError.message), {
      httpStatus: transitionError.code === "FORBIDDEN" ? 403 : 400,
    });
  }

  if (transitionRequiresEvidence(entry.approvalStage, payload.approvalStage)) {
    const evidenced = await hasEvidence("METRIC_ENTRY", payload.id, user.organizationId);
    if (!evidenced) {
      throw Object.assign(
        new Error("Evidence is required before moving to this stage. Please upload at least one supporting document."),
        { httpStatus: 422 },
      );
    }
  }

  const updated = await prisma.metricEntry.update({
    where: { id: payload.id },
    data: { approvalStage: payload.approvalStage },
  });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "METRIC_STAGE_TRANSITIONED",
    entityType: "MetricEntry",
    entityId: updated.id,
    beforeValueJson: { approvalStage: entry.approvalStage },
    afterValueJson:  { approvalStage: updated.approvalStage, comment: payload.comment },
  });

  const ownerId = entry.ownerUser?.id;
  if (ownerId && ownerId !== user.id) {
    await createNotification({
      organizationId: user.organizationId,
      userId: ownerId,
      type: payload.approvalStage === "APPROVED" ? "METRIC_APPROVED" : "REVISION_REQUESTED",
      title:
        payload.approvalStage === "APPROVED"
          ? "Metric entry approved"
          : `Metric entry moved to ${payload.approvalStage.replace(/_/g, " ").toLowerCase()}`,
      body: payload.comment ?? undefined,
      entityType: "METRIC_ENTRY",
      entityId: updated.id,
    });
  }

  return updated;
}

// ─── internal helper ───────────────────────────────────────────────────────────

async function resolvePrevPeriodValue(
  organizationId: string,
  payload: { reportingPeriodId: string; facilityId: string; metricDefinitionId: string; value?: number | null },
): Promise<number | null> {
  if (payload.value === null || payload.value === undefined) return null;

  const currentPeriod = await prisma.reportingPeriod.findUnique({
    where: { id: payload.reportingPeriodId },
    select: { startDate: true },
  });
  if (!currentPeriod) return null;

  const prevPeriod = await prisma.reportingPeriod.findFirst({
    where: { organizationId, endDate: { lt: currentPeriod.startDate } },
    orderBy: { endDate: "desc" },
  });
  if (!prevPeriod) return null;

  const prevEntry = await prisma.metricEntry.findFirst({
    where: {
      organizationId, // tenant-scope
      facilityId: payload.facilityId,
      metricDefinitionId: payload.metricDefinitionId,
      reportingPeriodId: prevPeriod.id,
    },
    select: { value: true },
  });

  return prevEntry?.value !== null && prevEntry?.value !== undefined
    ? Number(prevEntry.value)
    : null;
}
