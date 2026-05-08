import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ollamaChat } from "@/lib/ai-client";
import { buildRiskSuggestMessages } from "@/lib/prompts/risk-suggest";
import { apiError, apiOk } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  reportingPeriodId: z.string(),
  locale: z.enum(["tr", "en"]).default("tr"),
});

interface RiskSuggestion {
  name: string;
  type: string;
  probability: string;
  impact: string;
  timeHorizon: string;
  rationale: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const { reportingPeriodId, locale } = schema.parse(await request.json());

    const [org, existingRisks, emissionCalcs] = await Promise.all([
      prisma.organization.findUniqueOrThrow({
        where: { id: user.organizationId },
        select: { sasbSector: true, sector: true, reportingFrameworks: true },
      }),
      prisma.climateRisk.findMany({
        where: { organizationId: user.organizationId, reportingPeriodId },
        select: { name: true },
      }),
      prisma.emissionCalculation.findMany({
        where: { organizationId: user.organizationId, reportingPeriodId },
        select: { scope: true, resultTCO2e: true },
      }),
    ]);

    const scope1Total = emissionCalcs
      .filter((c) => c.scope === "SCOPE_1")
      .reduce((s, c) => s + Number(c.resultTCO2e), 0);
    const scope2Total = emissionCalcs
      .filter((c) => c.scope === "SCOPE_2")
      .reduce((s, c) => s + Number(c.resultTCO2e), 0);
    const scope3Total = emissionCalcs
      .filter((c) => c.scope === "SCOPE_3")
      .reduce((s, c) => s + Number(c.resultTCO2e), 0);

    const messages = buildRiskSuggestMessages({
      sector: org.sasbSector ?? org.sector,
      reportingFrameworks: org.reportingFrameworks,
      scope1Total,
      scope2Total,
      scope3Total,
      existingRiskNames: existingRisks.map((r) => r.name),
      locale,
    });

    const result = await ollamaChat({ messages, maxTokens: 1200, temperature: 0.5 });

    // Extract JSON from the model response robustly
    let suggestions: RiskSuggestion[] = [];
    try {
      const jsonMatch = result.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]) as RiskSuggestion[];
      }
    } catch {
      // Return raw content if JSON parsing fails so frontend can show it
      return apiOk({ suggestions: [], rawContent: result.content, model: result.model, durationMs: result.durationMs });
    }

    return apiOk({ suggestions, model: result.model, durationMs: result.durationMs });
  } catch (error) {
    return apiError(error, 500);
  }
}
