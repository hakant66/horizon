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

    const calcs = await prisma.emissionCalculation.findMany({
      where: { organizationId: user.organizationId, ...(reportingPeriodId ? { reportingPeriodId } : {}) },
      include: {
        facility: { select: { name: true } },
        metricEntry: { include: { metricDefinition: { select: { name: true, code: true } } } },
        emissionFactor: { select: { name: true, factorValue: true, activityUnit: true } },
        reportingPeriod: { select: { name: true } },
      },
      orderBy: [{ reportingPeriod: { name: "asc" } }, { scope: "asc" }],
    });

    const headers = [
      "reporting_period", "facility", "scope", "metric_code", "metric_name",
      "activity_value", "activity_unit", "emission_factor", "factor_unit",
      "result_tco2e", "scope2_method", "calculated_at",
    ];

    const rows = calcs.map((c) => [
      c.reportingPeriod.name,
      c.facility.name,
      c.scope,
      c.metricEntry.metricDefinition.code,
      c.metricEntry.metricDefinition.name,
      Number(c.activityValue),
      c.activityUnit,
      Number(c.emissionFactor.factorValue),
      c.emissionFactor.activityUnit,
      Number(c.resultTCO2e),
      c.scope2Method ?? "",
      c.createdAt.toISOString(),
    ]);

    const periodSlug = reportingPeriodId ? `-${reportingPeriodId.slice(0, 8)}` : "";
    return csvResponse(buildCsv(headers, rows), `emissions${periodSlug}.csv`);
  } catch (error) {
    return apiError(error, 400);
  }
}
