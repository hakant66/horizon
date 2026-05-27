import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import type { z } from "zod";
import type { climateRiskSchema } from "@/lib/validation";
import type { AuthUser } from "@/services/types";

type RiskPayload = z.infer<typeof climateRiskSchema>;

export function probabilityToScore(level: string): number {
  switch (level) {
    case "High":   return 4;
    case "Medium": return 2;
    case "Low":    return 1;
    default:       return 2;
  }
}

export async function listRisks(user: AuthUser, reportingPeriodId?: string) {
  return prisma.climateRisk.findMany({
    where: {
      organizationId: user.organizationId, // tenant-scope
      ...(reportingPeriodId ? { reportingPeriodId } : {}),
    },
    include: { facility: true, ownerUser: { select: { name: true } }, scenarios: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createRisk(user: AuthUser, payload: RiskPayload) {
  const probScore = payload.probabilityScore ?? probabilityToScore(payload.probability);
  const impScore  = payload.impactScore       ?? probabilityToScore(payload.impact);

  const risk = await prisma.climateRisk.create({
    data: {
      organizationId: user.organizationId,
      reportingPeriodId: payload.reportingPeriodId,
      facilityId: payload.facilityId || null,
      entryType: payload.entryType ?? "RISK",
      name: payload.name,
      type: payload.type,
      probability: payload.probability,
      impact: payload.impact,
      probabilityScore: probScore,
      impactScore: impScore,
      riskScore: probScore * impScore,
      timeHorizon: payload.timeHorizon ?? null,
      status: payload.status ?? "Open",
      residualRisk: payload.residualRisk ?? null,
      regulatoryRef: payload.regulatoryRef ?? null,
      financialImpactEstimate:
        payload.financialImpactEstimate == null
          ? null
          : new Prisma.Decimal(payload.financialImpactEstimate),
      ownerUserId: payload.ownerUserId || null,
      mitigationPlan: payload.mitigationPlan ?? null,
      notes: payload.notes ?? null,
    },
  });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CLIMATE_RISK_CREATED",
    entityType: "ClimateRisk",
    entityId: risk.id,
    afterValueJson: risk,
  });

  return risk;
}

export async function updateRisk(user: AuthUser, payload: RiskPayload) {
  if (!payload.id) throw new Error("id is required");

  const before = await prisma.climateRisk.findFirstOrThrow({
    where: { id: payload.id, organizationId: user.organizationId }, // tenant-scope
  });

  const probScore = payload.probabilityScore ?? probabilityToScore(payload.probability);
  const impScore  = payload.impactScore       ?? probabilityToScore(payload.impact);

  const risk = await prisma.climateRisk.update({
    where: { id: payload.id },
    data: {
      name: payload.name,
      type: payload.type,
      probability: payload.probability,
      impact: payload.impact,
      probabilityScore: probScore,
      impactScore: impScore,
      riskScore: probScore * impScore,
      timeHorizon: payload.timeHorizon ?? null,
      status: payload.status ?? "Open",
      residualRisk: payload.residualRisk ?? null,
      regulatoryRef: payload.regulatoryRef ?? null,
      financialImpactEstimate:
        payload.financialImpactEstimate == null
          ? null
          : new Prisma.Decimal(payload.financialImpactEstimate),
      facilityId: payload.facilityId || null,
      ownerUserId: payload.ownerUserId || null,
      mitigationPlan: payload.mitigationPlan ?? null,
      notes: payload.notes ?? null,
    },
  });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CLIMATE_RISK_UPDATED",
    entityType: "ClimateRisk",
    entityId: risk.id,
    beforeValueJson: before,
    afterValueJson: risk,
  });

  return risk;
}

export async function deleteRisk(user: AuthUser, id: string) {
  const before = await prisma.climateRisk.findFirstOrThrow({
    where: { id, organizationId: user.organizationId }, // tenant-scope
  });

  await prisma.climateRisk.delete({ where: { id } });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CLIMATE_RISK_DELETED",
    entityType: "ClimateRisk",
    entityId: id,
    beforeValueJson: before,
  });
}
