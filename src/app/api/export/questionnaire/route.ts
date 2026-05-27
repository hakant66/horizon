import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { buildCsv, csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  try {
    const user = await requireRole([
      "ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR", "HORIZON_CONSULTANT",
    ]);

    const { searchParams } = new URL(request.url);
    const reportingPeriodId = searchParams.get("reportingPeriodId") || undefined;
    const questionnaireId = searchParams.get("questionnaireId") || undefined;

    const answers = await prisma.questionnaireAnswer.findMany({
      where: {
        organizationId: user.organizationId,
        deleted_timestamp: null,
        ...(reportingPeriodId ? { reportingPeriodId } : {}),
        ...(questionnaireId ? { questionnaireId } : {}),
      },
      include: {
        questionnaireQuestion: { select: { code: true, title: true, section: true, unit: true } },
        questionnaire: { select: { name_tr: true } },
        reportingPeriod: { select: { name: true } },
        answeringUser: { select: { name: true } },
      },
      orderBy: [{ reportingPeriod: { name: "asc" } }, { questionnaire: { name_tr: "asc" } }],
    });

    const headers = [
      "reporting_period", "questionnaire", "section", "question_code", "question_title",
      "unit", "answer_text", "answer_number", "approval_stage", "answered_by", "answered_at",
    ];

    const rows = answers.map((a) => [
      a.reportingPeriod.name,
      a.questionnaire.name_tr,
      a.questionnaireQuestion.section,
      a.questionnaireQuestion.code ?? "",
      a.questionnaireQuestion.title,
      a.questionnaireQuestion.unit ?? "",
      a.answer_text ?? "",
      a.answer_number !== null ? Number(a.answer_number) : "",
      a.approvalStage,
      a.answeringUser.name,
      a.answering_timestamp.toISOString(),
    ]);

    const periodSlug = reportingPeriodId ? `-${reportingPeriodId.slice(0, 8)}` : "";
    return csvResponse(buildCsv(headers, rows), `questionnaire${periodSlug}.csv`);
  } catch (error) {
    return apiError(error, 400);
  }
}
