import { MetricEntryStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

const bulkRowSchema = z.object({
  facility: z.string().min(1),
  metric: z.string().min(1),
  value: z.number().nullable().optional(),
  unit: z.string().optional(),
  status: z.string().optional(),
  ownerEmail: z.string().email().optional(),
});

const bulkSchema = z.object({
  reportingPeriodId: z.string().min(1),
  rows: z.array(bulkRowSchema).min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR"]);
    const payload = bulkSchema.parse(await request.json());

    const [facilities, metricDefinitions, orgUsers] = await Promise.all([
      prisma.facility.findMany({ where: { organizationId: user.organizationId }, select: { id: true, name: true } }),
      prisma.metricDefinition.findMany({ select: { id: true, name: true, unit: true } }),
      prisma.user.findMany({ where: { organizationId: user.organizationId }, select: { id: true, email: true } }),
    ]);

    const facilityMap = new Map(facilities.map((f) => [f.name.trim().toLowerCase(), f]));
    const metricMap = new Map(metricDefinitions.map((m) => [m.name.trim().toLowerCase(), m]));
    const userMap = new Map(orgUsers.map((u) => [u.email.trim().toLowerCase(), u]));

    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < payload.rows.length; i += 1) {
      const row = payload.rows[i];
      const facility = facilityMap.get(row.facility.trim().toLowerCase());
      const metric = metricMap.get(row.metric.trim().toLowerCase());

      if (!facility) {
        errors.push(`Row ${i + 1}: facility not found (${row.facility})`);
        continue;
      }
      if (!metric) {
        errors.push(`Row ${i + 1}: metric not found (${row.metric})`);
        continue;
      }

      let status: MetricEntryStatus = MetricEntryStatus.IN_PROGRESS;
      if (row.status) {
        const normalized = row.status.trim().toUpperCase();
        if (normalized in MetricEntryStatus) status = MetricEntryStatus[normalized as keyof typeof MetricEntryStatus];
      }

      const ownerUserId = row.ownerEmail ? userMap.get(row.ownerEmail.trim().toLowerCase())?.id || null : null;

      const existing = await prisma.metricEntry.findUnique({
        where: {
          facilityId_reportingPeriodId_metricDefinitionId: {
            facilityId: facility.id,
            reportingPeriodId: payload.reportingPeriodId,
            metricDefinitionId: metric.id,
          },
        },
      });

      const unit = row.unit?.trim() || metric.unit;
      const value = row.value === null || row.value === undefined ? null : new Prisma.Decimal(row.value);

      const entry = existing
        ? await prisma.metricEntry.update({
            where: { id: existing.id },
            data: { value, unit, status, ownerUserId },
          })
        : await prisma.metricEntry.create({
            data: {
              organizationId: user.organizationId,
              facilityId: facility.id,
              reportingPeriodId: payload.reportingPeriodId,
              metricDefinitionId: metric.id,
              value,
              unit,
              status,
              ownerUserId,
            },
          });

      imported += 1;
      await createAuditLog({
        organizationId: user.organizationId,
        userId: user.id,
        action: existing ? "METRIC_ENTRY_UPDATED" : "METRIC_ENTRY_CREATED",
        entityType: "MetricEntry",
        entityId: entry.id,
        afterValueJson: entry,
      });
    }

    return apiOk({ imported, failed: errors.length, errors });
  } catch (error) {
    return apiError(error, 400);
  }
}
