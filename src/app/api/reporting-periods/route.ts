import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { periodSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR"]);
    const periods = await prisma.reportingPeriod.findMany({ where: { organizationId: user.organizationId }, orderBy: { startDate: "desc" } });
    return apiOk(periods);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const payload = periodSchema.parse(await request.json());
    const period = await prisma.reportingPeriod.create({
      data: {
        organizationId: user.organizationId,
        name: payload.name,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        status: payload.status,
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "REPORTING_PERIOD_CREATED",
      entityType: "ReportingPeriod",
      entityId: period.id,
      afterValueJson: period,
    });
    return apiOk(period, 201);
  } catch (error) {
    return apiError(error, 400);
  }
}
