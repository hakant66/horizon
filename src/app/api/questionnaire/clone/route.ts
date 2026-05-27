import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const body = (await request.json()) as { sourceQuestionnaireId: string; name_tr: string; name_en?: string | null };

    const { sourceQuestionnaireId, name_tr, name_en } = body;
    if (!sourceQuestionnaireId || !name_tr?.trim()) {
      return apiError("sourceQuestionnaireId and name_tr are required", 400);
    }

    const source = await prisma.questionnaire.findFirst({
      where: { id: sourceQuestionnaireId, organizationId: user.organizationId },
      include: {
        sections: {
          include: {
            subsections: {
              include: { questions: { orderBy: { created_datetime: "asc" } } },
              orderBy: { orderIndex: "asc" },
            },
            questions: { orderBy: { created_datetime: "asc" } },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!source) return apiError("Source questionnaire not found", 404);

    const newQ = await prisma.$transaction(async (tx) => {
      const q = await tx.questionnaire.create({
        data: {
          organizationId: user.organizationId,
          name_tr: name_tr.trim(),
          name_en: name_en?.trim() || null,
          type: source.type,
          description: source.description,
        },
        select: { id: true, name_tr: true },
      });

      for (let si = 0; si < source.sections.length; si++) {
        const sec = source.sections[si];
        const newSec = await tx.questionnaireSection.create({
          data: {
            organizationId: user.organizationId,
            questionnaireId: q.id,
            name: sec.name,
            orderIndex: si,
          },
          select: { id: true },
        });

        for (let ssi = 0; ssi < sec.subsections.length; ssi++) {
          const sub = sec.subsections[ssi];
          const newSub = await tx.questionnaireSubsection.create({
            data: {
              organizationId: user.organizationId,
              questionnaireSectionId: newSec.id,
              name: sub.name,
              orderIndex: ssi,
            },
            select: { id: true },
          });

          for (const q_ of sub.questions) {
            await tx.questionnaireQuestion.create({
              data: {
                organizationId: user.organizationId,
                questionnaireId: q.id,
                questionnaireSectionId: newSec.id,
                questionnaireSubsectionId: newSub.id,
                questionnaireTopicId: q_.questionnaireTopicId,
                code: q_.code,
                title: q_.title,
                question_text: q_.question_text,
                section: q_.section,
                unit: q_.unit,
                owner_name: q_.owner_name,
                owner_department: q_.owner_department,
                owner_email: q_.owner_email,
                helper: q_.helper,
                example: q_.example,
                reminder: q_.reminder,
                video_link: q_.video_link,
              },
            });
          }
        }

        for (const q_ of sec.questions.filter((q_) => q_.questionnaireSubsectionId === null)) {
          await tx.questionnaireQuestion.create({
            data: {
              organizationId: user.organizationId,
              questionnaireId: q.id,
              questionnaireSectionId: newSec.id,
              questionnaireTopicId: q_.questionnaireTopicId,
              code: q_.code,
              title: q_.title,
              question_text: q_.question_text,
              section: q_.section,
              unit: q_.unit,
              owner_name: q_.owner_name,
              owner_department: q_.owner_department,
              owner_email: q_.owner_email,
              helper: q_.helper,
              example: q_.example,
              reminder: q_.reminder,
              video_link: q_.video_link,
            },
          });
        }
      }

      return q;
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "QUESTIONNAIRE_CLONED",
      entityType: "Questionnaire",
      entityId: newQ.id,
      afterValueJson: { clonedFrom: sourceQuestionnaireId, name_tr: newQ.name_tr },
    });

    return apiOk(newQ);
  } catch (error) {
    return apiError(error, 500);
  }
}
