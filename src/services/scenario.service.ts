import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { z } from "zod";
import type { scenarioSchema } from "@/lib/validation";
import type { AuthUser } from "@/services/types";

type ScenarioPayload = z.infer<typeof scenarioSchema>;

export async function listScenarios(user: AuthUser, climateRiskId?: string | null) {
  return prisma.scenarioAnalysis.findMany({
    where: {
      ...(climateRiskId ? { climateRiskId } : {}),
      climateRisk: { organizationId: user.organizationId }, // tenant-scope via relation
    },
    include: { climateRisk: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createScenario(user: AuthUser, payload: ScenarioPayload) {
  // Verify the parent risk belongs to this org before creating.
  const risk = await prisma.climateRisk.findFirstOrThrow({
    where: { id: payload.climateRiskId, organizationId: user.organizationId }, // tenant-scope
  });

  return prisma.scenarioAnalysis.create({
    data: {
      climateRiskId: risk.id,
      scenarioName: payload.scenarioName,
      temperaturePathway: payload.temperaturePathway,
      scenarioFramework: payload.scenarioFramework ?? null,
      physicalHazard: payload.physicalHazard ?? null,
      qualitativeImpact: payload.qualitativeImpact ?? null,
      estimatedRevenueImpactPercent:
        payload.estimatedRevenueImpactPercent == null
          ? null
          : new Prisma.Decimal(payload.estimatedRevenueImpactPercent),
      estimatedCostImpact:
        payload.estimatedCostImpact == null
          ? null
          : new Prisma.Decimal(payload.estimatedCostImpact),
      assumptions: payload.assumptions ?? null,
      adaptationMeasure: payload.adaptationMeasure ?? null,
      confidenceLevel: payload.confidenceLevel ?? null,
    },
  });
}

export async function updateScenario(user: AuthUser, payload: ScenarioPayload) {
  if (!payload.id) throw new Error("id required");

  // Verify ownership via the parent risk.
  const existing = await prisma.scenarioAnalysis.findUniqueOrThrow({
    where: { id: payload.id },
    include: { climateRisk: true },
  });
  if (existing.climateRisk.organizationId !== user.organizationId) {
    throw new Error("Forbidden");
  }

  return prisma.scenarioAnalysis.update({
    where: { id: payload.id },
    data: {
      scenarioName: payload.scenarioName,
      temperaturePathway: payload.temperaturePathway,
      scenarioFramework: payload.scenarioFramework ?? null,
      physicalHazard: payload.physicalHazard ?? null,
      qualitativeImpact: payload.qualitativeImpact ?? null,
      estimatedRevenueImpactPercent:
        payload.estimatedRevenueImpactPercent == null
          ? null
          : new Prisma.Decimal(payload.estimatedRevenueImpactPercent),
      estimatedCostImpact:
        payload.estimatedCostImpact == null
          ? null
          : new Prisma.Decimal(payload.estimatedCostImpact),
      assumptions: payload.assumptions ?? null,
      adaptationMeasure: payload.adaptationMeasure ?? null,
      confidenceLevel: payload.confidenceLevel ?? null,
    },
  });
}

export async function deleteScenario(user: AuthUser, id: string) {
  const existing = await prisma.scenarioAnalysis.findUniqueOrThrow({
    where: { id },
    include: { climateRisk: { select: { organizationId: true } } },
  });
  if (existing.climateRisk.organizationId !== user.organizationId) {
    throw new Error("Forbidden");
  }

  await prisma.scenarioAnalysis.delete({ where: { id } });
}
