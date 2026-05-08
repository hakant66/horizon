import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { scenarioSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR"]);
    const { searchParams } = new URL(request.url);
    const climateRiskId = searchParams.get("climateRiskId");

    const scenarios = await prisma.scenarioAnalysis.findMany({
      where: {
        ...(climateRiskId ? { climateRiskId } : {}),
        climateRisk: { organizationId: user.organizationId },
      },
      include: { climateRisk: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return apiOk(scenarios);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER"]);
    const payload = scenarioSchema.parse(await request.json());

    const risk = await prisma.climateRisk.findFirstOrThrow({
      where: { id: payload.climateRiskId, organizationId: user.organizationId },
    });
    const scenario = await prisma.scenarioAnalysis.create({
      data: {
        climateRiskId: risk.id,
        scenarioName: payload.scenarioName,
        temperaturePathway: payload.temperaturePathway,
        scenarioFramework: payload.scenarioFramework ?? null,
        physicalHazard: payload.physicalHazard ?? null,
        qualitativeImpact: payload.qualitativeImpact ?? null,
        estimatedRevenueImpactPercent:
          payload.estimatedRevenueImpactPercent == null ? null : new Prisma.Decimal(payload.estimatedRevenueImpactPercent),
        estimatedCostImpact:
          payload.estimatedCostImpact == null ? null : new Prisma.Decimal(payload.estimatedCostImpact),
        assumptions: payload.assumptions ?? null,
        adaptationMeasure: payload.adaptationMeasure ?? null,
        confidenceLevel: payload.confidenceLevel ?? null,
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

    const existing = await prisma.scenarioAnalysis.findUniqueOrThrow({
      where: { id: payload.id },
      include: { climateRisk: true },
    });
    if (existing.climateRisk.organizationId !== user.organizationId) throw new Error("Forbidden");

    const scenario = await prisma.scenarioAnalysis.update({
      where: { id: payload.id },
      data: {
        scenarioName: payload.scenarioName,
        temperaturePathway: payload.temperaturePathway,
        scenarioFramework: payload.scenarioFramework ?? null,
        physicalHazard: payload.physicalHazard ?? null,
        qualitativeImpact: payload.qualitativeImpact ?? null,
        estimatedRevenueImpactPercent:
          payload.estimatedRevenueImpactPercent == null ? null : new Prisma.Decimal(payload.estimatedRevenueImpactPercent),
        estimatedCostImpact:
          payload.estimatedCostImpact == null ? null : new Prisma.Decimal(payload.estimatedCostImpact),
        assumptions: payload.assumptions ?? null,
        adaptationMeasure: payload.adaptationMeasure ?? null,
        confidenceLevel: payload.confidenceLevel ?? null,
      },
    });
    return apiOk(scenario);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const { id } = (await request.json()) as { id: string };

    const existing = await prisma.scenarioAnalysis.findUniqueOrThrow({
      where: { id },
      include: { climateRisk: { select: { organizationId: true } } },
    });
    if (existing.climateRisk.organizationId !== user.organizationId) throw new Error("Forbidden");

    await prisma.scenarioAnalysis.delete({ where: { id } });
    return apiOk({ success: true });
  } catch (error) {
    return apiError(error, 400);
  }
}
