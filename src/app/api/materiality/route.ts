import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { materialitySchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { calculateMateriality } from "@/lib/calculations";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR"]);
    const { searchParams } = new URL(request.url);
    const reportingPeriodId = searchParams.get("reportingPeriodId") || undefined;

    const topics = await prisma.materialityTopic.findMany({
      where: { organizationId: user.organizationId, ...(reportingPeriodId ? { reportingPeriodId } : {}) },
      orderBy: { name: "asc" },
    });
    return apiOk(topics);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const payload = materialitySchema.parse(await request.json());
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

    return apiOk(topic, 201);
  } catch (error) {
    return apiError(error, 400);
  }
}
