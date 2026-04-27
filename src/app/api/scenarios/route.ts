import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { scenarioSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER"]);
    const payload = scenarioSchema.parse(await request.json());

    const risk = await prisma.climateRisk.findFirstOrThrow({ where: { id: payload.climateRiskId, organizationId: user.organizationId } });
    const scenario = await prisma.scenarioAnalysis.create({
      data: {
        climateRiskId: risk.id,
        scenarioName: payload.scenarioName,
        temperaturePathway: payload.temperaturePathway,
        qualitativeImpact: payload.qualitativeImpact,
        estimatedRevenueImpactPercent:
          payload.estimatedRevenueImpactPercent === null || payload.estimatedRevenueImpactPercent === undefined
            ? null
            : new Prisma.Decimal(payload.estimatedRevenueImpactPercent),
        estimatedCostImpact:
          payload.estimatedCostImpact === null || payload.estimatedCostImpact === undefined
            ? null
            : new Prisma.Decimal(payload.estimatedCostImpact),
        assumptions: payload.assumptions,
      },
    });

    return apiOk(scenario, 201);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER"]);
    const payload = scenarioSchema.parse(await request.json());
    if (!payload.id) throw new Error("id required");

    const existing = await prisma.scenarioAnalysis.findUniqueOrThrow({ where: { id: payload.id }, include: { climateRisk: true } });
    if (existing.climateRisk.organizationId !== user.organizationId) throw new Error("Forbidden");

    const scenario = await prisma.scenarioAnalysis.update({
      where: { id: payload.id },
      data: {
        scenarioName: payload.scenarioName,
        temperaturePathway: payload.temperaturePathway,
        qualitativeImpact: payload.qualitativeImpact,
        estimatedRevenueImpactPercent:
          payload.estimatedRevenueImpactPercent === null || payload.estimatedRevenueImpactPercent === undefined
            ? null
            : new Prisma.Decimal(payload.estimatedRevenueImpactPercent),
        estimatedCostImpact:
          payload.estimatedCostImpact === null || payload.estimatedCostImpact === undefined
            ? null
            : new Prisma.Decimal(payload.estimatedCostImpact),
        assumptions: payload.assumptions,
      },
    });
    return apiOk(scenario);
  } catch (error) {
    return apiError(error, 400);
  }
}
