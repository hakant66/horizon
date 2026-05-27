import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { ollamaChat } from "@/lib/ai-client";
import { buildReportNarrativeMessages, type ReportSection } from "@/lib/prompts/report-narrative";

const SECTIONS: ReportSection[] = ["governance", "strategy", "riskManagement", "metricsTargets"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "HORIZON_CONSULTANT"]);
    const { id } = await params;
    const { sections = SECTIONS, locale = "tr" } = (await request.json()) as {
      sections?: ReportSection[];
      locale?: "tr" | "en";
    };

    const [report, org] = await Promise.all([
      prisma.report.findFirstOrThrow({
        where: { id, organizationId: user.organizationId },
        include: { reportingPeriod: { select: { name: true } } },
      }),
      prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { name: true, sector: true, reportingFrameworks: true },
      }),
    ]);

    const [metricsCount, emissionsAgg, risksCount, targetsCount] = await Promise.all([
      prisma.metricEntry.count({
        where: { organizationId: user.organizationId, reportingPeriodId: report.reportingPeriodId },
      }),
      prisma.emissionCalculation.aggregate({
        where: { organizationId: user.organizationId, reportingPeriodId: report.reportingPeriodId },
        _sum: { resultTCO2e: true },
      }),
      prisma.climateRisk.count({
        where: { organizationId: user.organizationId, reportingPeriodId: report.reportingPeriodId },
      }),
      prisma.target.count({
        where: { organizationId: user.organizationId, reportingPeriodId: report.reportingPeriodId },
      }),
    ]);

    const sectionTextMap: Record<ReportSection, string | null> = {
      governance: report.governanceText ?? null,
      strategy: report.strategyText ?? null,
      riskManagement: report.riskManagementText ?? null,
      metricsTargets: report.metricsTargetsText ?? null,
    };

    const results: Partial<Record<ReportSection, string>> = {};

    for (const section of sections) {
      const messages = buildReportNarrativeMessages({
        section,
        organizationName: org?.name ?? "Organization",
        sector: org?.sector ?? "General",
        reportingPeriodName: report.reportingPeriod.name,
        frameworks: org?.reportingFrameworks ?? [],
        context: {
          totalEmissionsTCO2e: Number(emissionsAgg._sum.resultTCO2e ?? 0),
          metricsCount,
          risksCount,
          targetsCount,
          existingText: sectionTextMap[section],
        },
        locale,
      });

      const result = await ollamaChat({ messages, maxTokens: 600, temperature: 0.4 });
      results[section] = result.content;
    }

    return apiOk({ narratives: results, sections });
  } catch (error) {
    return apiError(error, 400);
  }
}
