import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { ollamaChat } from "@/lib/ai-client";
import { buildMetricsReviewMessages } from "@/lib/prompts/metrics-review";
import { detectAnomaly } from "@/lib/anomaly";

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "HORIZON_CONSULTANT"]);
    const { reportingPeriodId, locale = "tr" } = (await request.json()) as {
      reportingPeriodId: string;
      locale?: "tr" | "en";
    };

    if (!reportingPeriodId) throw new Error("reportingPeriodId is required");

    const [period, org, entries] = await Promise.all([
      prisma.reportingPeriod.findFirstOrThrow({
        where: { id: reportingPeriodId, organizationId: user.organizationId },
        select: { name: true, startDate: true },
      }),
      prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { name: true, sector: true },
      }),
      prisma.metricEntry.findMany({
        where: { organizationId: user.organizationId, reportingPeriodId },
        include: {
          facility: { select: { name: true } },
          metricDefinition: { select: { name: true, code: true, category: true } },
        },
      }),
    ]);

    // Compute YoY anomalies for each entry.
    const prevPeriod = await prisma.reportingPeriod.findFirst({
      where: { organizationId: user.organizationId, endDate: { lt: period.startDate } },
      orderBy: { endDate: "desc" },
    });

    const prevValuesMap = new Map<string, number>();
    if (prevPeriod) {
      const prevEntries = await prisma.metricEntry.findMany({
        where: { organizationId: user.organizationId, reportingPeriodId: prevPeriod.id },
        select: { metricDefinitionId: true, facilityId: true, value: true },
      });
      for (const pe of prevEntries) {
        if (pe.value !== null) {
          prevValuesMap.set(`${pe.facilityId}:${pe.metricDefinitionId}`, Number(pe.value));
        }
      }
    }

    const reviewEntries = entries.map((e) => {
      const prev = prevValuesMap.get(`${e.facilityId}:${e.metricDefinitionId}`) ?? null;
      const anomaly =
        e.value !== null && prev !== null ? detectAnomaly(Number(e.value), prev) : null;
      return {
        metricCode: e.metricDefinition.code,
        metricName: e.metricDefinition.name,
        category: e.metricDefinition.category,
        value: e.value !== null ? Number(e.value) : null,
        unit: e.unit,
        facilityName: e.facility.name,
        anomaly,
      };
    });

    const messages = buildMetricsReviewMessages({
      entries: reviewEntries,
      reportingPeriodName: period.name,
      sector: org?.sector ?? "General",
      locale,
    });

    const result = await ollamaChat({ messages, maxTokens: 512, temperature: 0.2 });

    return apiOk({
      review: result.content,
      model: result.model,
      durationMs: result.durationMs,
      stats: {
        total: entries.length,
        missing: entries.filter((e) => e.value === null).length,
        withAnomalies: reviewEntries.filter((e) => e.anomaly?.isWarning).length,
      },
    });
  } catch (error) {
    return apiError(error, 400);
  }
}
