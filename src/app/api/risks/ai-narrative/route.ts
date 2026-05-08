import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ollamaChat } from "@/lib/ai-client";
import { buildRiskNarrativeMessages } from "@/lib/prompts/risk-narrative";
import { apiError, apiOk } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  riskId: z.string(),
  locale: z.enum(["tr", "en"]).default("tr"),
});

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER"]);
    const { riskId, locale } = schema.parse(await request.json());

    const risk = await prisma.climateRisk.findFirstOrThrow({
      where: { id: riskId, organizationId: user.organizationId },
    });

    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: user.organizationId },
      select: { sasbSector: true, sector: true, reportingFrameworks: true },
    });

    const messages = buildRiskNarrativeMessages({
      riskName: risk.name,
      riskType: risk.type,
      probability: risk.probability,
      impact: risk.impact,
      timeHorizon: risk.timeHorizon,
      mitigationPlan: risk.mitigationPlan,
      regulatoryRef: risk.regulatoryRef,
      financialImpactEstimate: risk.financialImpactEstimate ? Number(risk.financialImpactEstimate) : null,
      sector: org.sasbSector ?? org.sector,
      reportingFrameworks: org.reportingFrameworks,
      locale,
    });

    const result = await ollamaChat({ messages, maxTokens: 800, temperature: 0.3 });

    const updated = await prisma.climateRisk.update({
      where: { id: riskId },
      data: {
        aiNarrative: result.content,
        aiNarrativeAt: new Date(),
      },
    });

    return apiOk({
      narrative: result.content,
      model: result.model,
      durationMs: result.durationMs,
      updatedAt: updated.aiNarrativeAt,
    });
  } catch (error) {
    return apiError(error, 500);
  }
}
