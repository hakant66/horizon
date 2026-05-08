import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ollamaChat } from "@/lib/ai-client";
import { buildScenarioSummaryMessages } from "@/lib/prompts/scenario-summary";
import { apiError, apiOk } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  climateRiskId: z.string(),
  locale: z.enum(["tr", "en"]).default("tr"),
});

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER"]);
    const { climateRiskId, locale } = schema.parse(await request.json());

    const risk = await prisma.climateRisk.findFirstOrThrow({
      where: { id: climateRiskId, organizationId: user.organizationId },
      include: { scenarios: true },
    });

    if (risk.scenarios.length === 0) {
      return apiOk({ summary: locale === "tr" ? "Bu riske ait senaryo bulunamadı." : "No scenarios found for this risk." });
    }

    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: user.organizationId },
      select: { sasbSector: true, sector: true },
    });

    const messages = buildScenarioSummaryMessages({
      riskName: risk.name,
      riskType: risk.type,
      sector: org.sasbSector ?? org.sector,
      scenarios: risk.scenarios.map((s) => ({
        scenarioName: s.scenarioName,
        temperaturePathway: s.temperaturePathway,
        scenarioFramework: s.scenarioFramework,
        estimatedRevenueImpactPercent: s.estimatedRevenueImpactPercent ? Number(s.estimatedRevenueImpactPercent) : null,
        estimatedCostImpact: s.estimatedCostImpact ? Number(s.estimatedCostImpact) : null,
        qualitativeImpact: s.qualitativeImpact,
        assumptions: s.assumptions,
      })),
      locale,
    });

    const result = await ollamaChat({ messages, maxTokens: 600, temperature: 0.3 });

    // Persist summary on first scenario (or could be stored on the risk itself)
    await prisma.scenarioAnalysis.updateMany({
      where: { climateRiskId },
      data: { aiImpactSummary: result.content },
    });

    return apiOk({ summary: result.content, model: result.model, durationMs: result.durationMs });
  } catch (error) {
    return apiError(error, 500);
  }
}
