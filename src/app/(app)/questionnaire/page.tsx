import { redirect } from "next/navigation";
import { QuestionnaireWorkspaceClient } from "@/components/domain/QuestionnaireWorkspaceClient";
import { getWorkspaceContext } from "@/lib/context";
import { prisma } from "@/lib/prisma";

export default async function QuestionnairePage() {
  const { organization, reportingPeriod } = await getWorkspaceContext();
  if (!reportingPeriod) {
    redirect("/setup");
  }

  const [topics, questionnaires] = await Promise.all([
    prisma.questionnaireTopic.findMany({ where: { organizationId: organization.id }, orderBy: { name_tr: "asc" } }),
    prisma.questionnaire.findMany({
      where: { organizationId: organization.id },
      include: {
        sections: {
          include: {
            subsections: {
              include: { questions: true },
              orderBy: { orderIndex: "asc" },
            },
            questions: true,
          },
          orderBy: { orderIndex: "asc" },
        },
        answers: { where: { deleted_timestamp: null }, select: { id: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const selected = questionnaires[0];
  const answers = selected
    ? await prisma.questionnaireAnswer.findMany({
        where: {
          organizationId: organization.id,
          questionnaireId: selected.id,
          reportingPeriodId: reportingPeriod.id,
          deleted_timestamp: null,
        },
      })
    : [];

  const totalQuestions = selected
    ? await prisma.questionnaireQuestion.count({ where: { organizationId: organization.id, questionnaireId: selected.id } })
    : 0;
  const answered = answers.length;

  return (
    <QuestionnaireWorkspaceClient
      reportingPeriodId={reportingPeriod.id}
      initialTopics={topics}
      initialQuestionnaires={questionnaires}
      initialAnswers={answers.map((a) => ({ ...a, answer_number: a.answer_number?.toString() || null }))}
      initialDashboard={{
        totalQuestions,
        answered,
        remaining: Math.max(totalQuestions - answered, 0),
        progress: totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0,
      }}
    />
  );
}
