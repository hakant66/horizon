import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { climateRiskSchema } from "@/lib/validation";
import { createAuditLog } from "@/lib/audit";
import { apiError, apiOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR"]);
    const { searchParams } = new URL(request.url);
    const reportingPeriodId = searchParams.get("reportingPeriodId") || undefined;
    const risks = await prisma.climateRisk.findMany({
      where: { organizationId: user.organizationId, ...(reportingPeriodId ? { reportingPeriodId } : {}) },
      include: { facility: true, ownerUser: { select: { name: true } }, scenarios: true },
      orderBy: { createdAt: "desc" },
    });
    return apiOk(risks);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER"]);
    const payload = climateRiskSchema.parse(await request.json());

    const probScore = payload.probabilityScore ?? probabilityToScore(payload.probability);
    const impScore = payload.impactScore ?? probabilityToScore(payload.impact);

    const risk = await prisma.climateRisk.create({
      data: {
        organizationId: user.organizationId,
        reportingPeriodId: payload.reportingPeriodId,
        facilityId: payload.facilityId || null,
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
          payload.financialImpactEstimate == null ? null : new Prisma.Decimal(payload.financialImpactEstimate),
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
    return apiOk(risk, 201);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER"]);
    const payload = climateRiskSchema.parse(await request.json());
    if (!payload.id) throw new Error("id is required");

    const before = await prisma.climateRisk.findFirstOrThrow({
      where: { id: payload.id, organizationId: user.organizationId },
    });

    const probScore = payload.probabilityScore ?? probabilityToScore(payload.probability);
    const impScore = payload.impactScore ?? probabilityToScore(payload.impact);

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
          payload.financialImpactEstimate == null ? null : new Prisma.Decimal(payload.financialImpactEstimate),
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
    return apiOk(risk);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const { id } = (await request.json()) as { id: string };
    const before = await prisma.climateRisk.findFirstOrThrow({
      where: { id, organizationId: user.organizationId },
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
    return apiOk({ success: true });
  } catch (error) {
    return apiError(error, 400);
  }
}

function probabilityToScore(level: string): number {
  switch (level) {
    case "High":   return 4;
    case "Medium": return 2;
    case "Low":    return 1;
    default:       return 2;
  }
}
