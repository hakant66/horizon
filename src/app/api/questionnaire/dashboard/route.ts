import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR", "FINANCE_REVIEWER", "AUDITOR"]);
    const { searchParams } = new URL(request.url);
    const questionnaireId = searchParams.get("questionnaireId") || undefined;
    const reportingPeriodId = searchParams.get("reportingPeriodId") || undefined;

    const whereQ = { organizationId: user.organizationId, ...(questionnaireId ? { questionnaireId } : {}) };
    const totalQuestions = await prisma.questionnaireQuestion.count({ where: whereQ });

    const answeredQuestionIds = await prisma.questionnaireAnswer.findMany({
      where: {
        organizationId: user.organizationId,
        deleted_timestamp: null,
        ...(questionnaireId ? { questionnaireId } : {}),
        ...(reportingPeriodId ? { reportingPeriodId } : {}),
      },
      select: { questionnaireQuestionId: true },
      distinct: ["questionnaireQuestionId"],
    });

    const answered = answeredQuestionIds.length;
    const remaining = Math.max(totalQuestions - answered, 0);
    const progress = totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0;

    return apiOk({ totalQuestions, answered, remaining, progress });
  } catch (error) {
    return apiError(error, 401);
  }
}
