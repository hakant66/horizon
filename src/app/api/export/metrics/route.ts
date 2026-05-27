import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { buildCsv, csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  try {
    const user = await requireRole([
      "ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR", "HORIZON_CONSULTANT",
    ]);

    const { searchParams } = new URL(request.url);
    const reportingPeriodId = searchParams.get("reportingPeriodId") || undefined;

    const entries = await prisma.metricEntry.findMany({
      where: { organizationId: user.organizationId, ...(reportingPeriodId ? { reportingPeriodId } : {}) },
      include: {
        facility: { select: { name: true } },
        metricDefinition: { select: { name: true, code: true, category: true } },
        reportingPeriod: { select: { name: true } },
        ownerUser: { select: { name: true, email: true } },
      },
      orderBy: [{ reportingPeriod: { name: "asc" } }, { facility: { name: "asc" } }, { metricDefinition: { name: "asc" } }],
    });

    const headers = [
      "reporting_period", "facility", "metric_code", "metric_name", "category",
      "value", "unit", "status", "approval_stage", "owner", "notes", "created_at",
    ];

    const rows = entries.map((e) => [
      e.reportingPeriod.name,
      e.facility.name,
      e.metricDefinition.code,
      e.metricDefinition.name,
      e.metricDefinition.category,
      e.value !== null ? Number(e.value) : "",
      e.unit,
      e.status,
      e.approvalStage,
      e.ownerUser?.name ?? "",
      e.notes ?? "",
      e.createdAt.toISOString(),
    ]);

    const periodSlug = reportingPeriodId ? `-${reportingPeriodId.slice(0, 8)}` : "";
    return csvResponse(buildCsv(headers, rows), `metrics${periodSlug}.csv`);
  } catch (error) {
    return apiError(error, 400);
  }
}
