import { ApprovalStage } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireRole([
      "ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR", "HORIZON_CONSULTANT",
    ]);

    const { searchParams } = new URL(request.url);
    const reportingPeriodId = searchParams.get("reportingPeriodId") || undefined;

    const [metricGroups, answerGroups] = await Promise.all([
      prisma.metricEntry.groupBy({
        by: ["approvalStage"],
        where: {
          organizationId: user.organizationId,
          ...(reportingPeriodId ? { reportingPeriodId } : {}),
        },
        _count: { id: true },
      }),
      prisma.questionnaireAnswer.groupBy({
        by: ["approvalStage"],
        where: {
          organizationId: user.organizationId,
          deleted_timestamp: null,
          ...(reportingPeriodId ? { reportingPeriodId } : {}),
        },
        _count: { id: true },
      }),
    ]);

    const emptyStages = Object.fromEntries(
      Object.values(ApprovalStage).map((s) => [s, 0]),
    ) as Record<ApprovalStage, number>;

    const metrics = { ...emptyStages };
    for (const g of metricGroups) metrics[g.approvalStage] = g._count.id;

    const answers = { ...emptyStages };
    for (const g of answerGroups) answers[g.approvalStage] = g._count.id;

    return apiOk({ metrics, answers });
  } catch (error) {
    return apiError(error, 400);
  }
}
