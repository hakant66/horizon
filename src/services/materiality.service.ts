import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { calculateMateriality } from "@/lib/calculations";
import type { z } from "zod";
import type { materialitySchema } from "@/lib/validation";
import type { AuthUser } from "@/services/types";

type MaterialityPayload = z.infer<typeof materialitySchema>;

export async function listMaterialityTopics(user: AuthUser, reportingPeriodId?: string) {
  return prisma.materialityTopic.findMany({
    where: {
      organizationId: user.organizationId, // tenant-scope
      ...(reportingPeriodId ? { reportingPeriodId } : {}),
    },
    orderBy: { name: "asc" },
  });
}

export async function upsertMaterialityTopic(user: AuthUser, payload: MaterialityPayload) {
  const isMaterial = calculateMateriality(payload);

  const topic = await prisma.materialityTopic.upsert({
    where: {
      organizationId_reportingPeriodId_name: {
        organizationId: user.organizationId,
        reportingPeriodId: payload.reportingPeriodId,
        name: payload.name,
      },
    },
    create: {
      organizationId: user.organizationId,
      reportingPeriodId: payload.reportingPeriodId,
      name: payload.name,
      category: payload.category,
      financialImpactScore: payload.financialImpactScore,
      impactSeverityScore: payload.impactSeverityScore,
      likelihoodScore: payload.likelihoodScore,
      stakeholderConcernScore: payload.stakeholderConcernScore,
      notes: payload.notes,
      isMaterial,
    },
    update: {
      category: payload.category,
      financialImpactScore: payload.financialImpactScore,
      impactSeverityScore: payload.impactSeverityScore,
      likelihoodScore: payload.likelihoodScore,
      stakeholderConcernScore: payload.stakeholderConcernScore,
      notes: payload.notes,
      isMaterial,
    },
  });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "MATERIALITY_SCORED",
    entityType: "MaterialityTopic",
    entityId: topic.id,
    afterValueJson: topic,
  });

  return topic;
}
