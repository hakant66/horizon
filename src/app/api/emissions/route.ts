import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR", "FINANCE_REVIEWER", "AUDITOR"]);
    const { searchParams } = new URL(request.url);
    const reportingPeriodId = searchParams.get("reportingPeriodId") || undefined;

    const calculations = await prisma.emissionCalculation.findMany({
      where: { organizationId: user.organizationId, ...(reportingPeriodId ? { reportingPeriodId } : {}) },
      include: {
        metricEntry: { include: { metricDefinition: true, facility: true } },
        emissionFactor: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const factors = await prisma.emissionFactor.findMany({ orderBy: [{ scope: "asc" }, { category: "asc" }] });
    return apiOk({ calculations, factors });
  } catch (error) {
    return apiError(error, 401);
  }
}
